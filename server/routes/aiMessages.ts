/**
 * POST /api/ai-messages — recibe las preguntas de IA de un Resto FADEY.
 * Misma clave que los pagos (API_SECRET_KEY o API_INGEST_SECRET).
 * Un reenvío del mismo servicio, día y propósito reemplaza el lote anterior.
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

const posLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizeBaseUrl(raw: string) {
  return String(raw || "").trim().replace(/\/+$/, "");
}

function resolvePosSecret() {
  return String(
    process.env.API_SECRET_KEY || process.env.API_INGEST_SECRET || "",
  ).trim();
}

function isPosBearer(req: { headers: Record<string, string | string[] | undefined> }) {
  const secret = resolvePosSecret();
  if (!secret) return false;
  const auth = String(req.headers.authorization || "");
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  return bearer === secret || apiKey === secret;
}

async function findLinkedUser(body: Record<string, unknown>) {
  const clientId = String(body.clientId || "").trim();
  const licenseKey = String(body.licenseKey || body.webServiceId || "").trim();
  const sourceUrl = normalizeBaseUrl(String(body.sourceWebServiceUrl || "").trim());

  if (clientId) {
    const byId = await prisma.clientUser.findUnique({ where: { id: clientId } });
    if (byId?.active) return byId;
    const byLicense = await prisma.clientUser.findUnique({ where: { licenseKey: clientId } });
    if (byLicense?.active) return byLicense;
  }
  if (licenseKey) {
    const byLicense = await prisma.clientUser.findUnique({ where: { licenseKey } });
    if (byLicense?.active) return byLicense;
    const byId = await prisma.clientUser.findUnique({ where: { id: licenseKey } });
    if (byId?.active) return byId;
  }
  if (sourceUrl) {
    const byUrl = await prisma.clientUser.findFirst({
      where: { webServiceUrl: sourceUrl, active: true },
    });
    if (byUrl) return byUrl;
  }
  return null;
}

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeCategories(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map((cat) => {
    const row = (cat && typeof cat === "object" ? cat : {}) as Record<string, unknown>;
    const users = Array.isArray(row.users) ? row.users.slice(0, 300) : [];
    return {
      id: clip(row.id, 40),
      label: clip(row.label, 80),
      users: users.map((user) => {
        const u = (user && typeof user === "object" ? user : {}) as Record<string, unknown>;
        const messages = Array.isArray(u.messages) ? u.messages.slice(0, 500) : [];
        return {
          userId: clip(u.userId, 80),
          name: clip(u.name, 120) || "Usuario",
          role: clip(u.role, 40),
          messages: messages.map((msg) => {
            const m = (msg && typeof msg === "object" ? msg : {}) as Record<string, unknown>;
            return {
              id: clip(m.id, 80),
              at: clip(m.at, 40),
              text: clip(m.text, 1500),
            };
          }).filter((m) => m.text),
        };
      }).filter((u) => u.messages.length > 0),
    };
  }).filter((c) => c.users.length > 0);
}

function countMessages(categories: ReturnType<typeof normalizeCategories>) {
  return categories.reduce(
    (sum, cat) => sum + cat.users.reduce((n, user) => n + user.messages.length, 0),
    0,
  );
}

export const aiMessagesRouter = Router();

aiMessagesRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const batches = await prisma.aiTrainingBatch.findMany({
      orderBy: [{ businessDay: "desc" }, { receivedAt: "desc" }],
      take: 120,
      include: {
        user: { select: { id: true, clientName: true, username: true } },
      },
    });
    res.json({
      batches: batches.map((row) => ({
        id: row.id,
        batchId: row.batchId,
        webServiceId: row.webServiceId,
        clientId: row.clientId,
        restaurantName: row.restaurantName,
        businessDay: row.businessDay,
        purpose: row.purpose,
        test: row.test,
        messageCount: row.messageCount,
        receivedAt: row.receivedAt.toISOString(),
        sourceUrl: row.sourceUrl,
        user: row.user,
        categories: row.payload,
      })),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

aiMessagesRouter.delete("/:id/items", requireAdmin, async (req, res) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const categoryId = clip(body.categoryId, 40);
    const userId = clip(body.userId, 80);
    const messageId = clip(body.messageId, 80);
    const row = await prisma.aiTrainingBatch.findUnique({ where: { id: String(req.params.id) } });
    if (!row) {
      res.status(404).json({ error: "No se encontró el lote" });
      return;
    }
    const categories = Array.isArray(row.payload) ? row.payload : [];
    const next = categories
      .map((cat) => {
        const c = (cat && typeof cat === "object" ? cat : {}) as Record<string, unknown>;
        if (categoryId && clip(c.id, 40) !== categoryId) return c;
        const users = Array.isArray(c.users) ? c.users : [];
        return {
          ...c,
          users: users
            .map((user) => {
              const u = (user && typeof user === "object" ? user : {}) as Record<string, unknown>;
              if (userId && clip(u.userId, 80) !== userId) return u;
              const messages = Array.isArray(u.messages) ? u.messages : [];
              return {
                ...u,
                messages: messages.filter((msg) => {
                  const m = (msg && typeof msg === "object" ? msg : {}) as Record<string, unknown>;
                  return clip(m.id, 80) !== messageId;
                }),
              };
            })
            .filter((u) => Array.isArray(u.messages) && u.messages.length > 0),
        };
      })
      .filter((c) => Array.isArray(c.users) && c.users.length > 0);
    const messageCount = countMessages(next as ReturnType<typeof normalizeCategories>);
    if (!messageCount) {
      await prisma.aiTrainingBatch.delete({ where: { id: String(row.id) } });
      res.json({ ok: true, deletedBatch: true });
      return;
    }
    await prisma.aiTrainingBatch.update({
      where: { id: String(row.id) },
      data: { payload: next as Prisma.InputJsonValue, messageCount },
    });
    res.json({ ok: true, messageCount });
  } catch (err) {
    sendApiError(res, err);
  }
});

aiMessagesRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.aiTrainingBatch.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    sendApiError(res, err);
  }
});

aiMessagesRouter.post("/", posLimit, async (req, res) => {
  if (!resolvePosSecret()) {
    res.status(503).json({ error: "El panel no tiene API_SECRET_KEY ni API_INGEST_SECRET." });
    return;
  }
  if (!isPosBearer(req)) {
    res.status(401).json({ error: "API key inválida" });
    return;
  }

  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const categories = normalizeCategories(body.categories);
    const messageCount = countMessages(categories);
    if (!messageCount) {
      res.status(400).json({ error: "El lote no trae mensajes." });
      return;
    }

    const businessDay = clip(body.businessDay, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDay)) {
      res.status(400).json({ error: "businessDay debe ser YYYY-MM-DD." });
      return;
    }

    const webServiceId = clip(body.webServiceId || body.clientId, 80);
    if (!webServiceId) {
      res.status(400).json({ error: "webServiceId o clientId es requerido." });
      return;
    }

    const purpose = clip(body.purpose, 40) || "ai_training";
    const test = body.test === true || purpose.includes("test");
    const user = await findLinkedUser(body);
    const restaurantName = clip(body.restaurantName || user?.clientName, 160);
    const batchId = clip(
      body.batchId || `ai-messages:${webServiceId}:${businessDay}:${purpose}`,
      180,
    );

    const data = {
      batchId,
      userId: user?.id || null,
      webServiceId,
      clientId: clip(body.clientId, 80),
      licenseKey: clip(body.licenseKey, 80),
      sourceUrl: normalizeBaseUrl(clip(body.sourceWebServiceUrl, 300)),
      restaurantName,
      businessDay,
      purpose,
      test,
      messageCount,
      payload: categories,
      receivedAt: new Date(),
    };

    const saved = await prisma.aiTrainingBatch.upsert({
      where: {
        webServiceId_businessDay_purpose: { webServiceId, businessDay, purpose },
      },
      create: data,
      update: data,
    });

    res.status(201).json({
      ok: true,
      id: saved.id,
      batchId: saved.batchId,
      businessDay: saved.businessDay,
      purpose: saved.purpose,
      messageCount: saved.messageCount,
      clientId: user?.id || data.clientId || null,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});
