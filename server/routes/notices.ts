/**
 * Avisos de la web central hacia los Resto FADEY.
 * El panel admin publica para todos o para planes concretos.
 * El POS lee GET /api/notices/for-pos y también puede publicar con la misma clave de API.
 * Lo vencido se borra para no ocupar la base.
 */
import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

const PLAN_KEYS = ["basico", "emprendedor", "profesional", "negocio", "premium"] as const;

const PLAN_ALIASES: Record<string, (typeof PLAN_KEYS)[number]> = {
  básico: "basico",
  basic: "basico",
  starter: "emprendedor",
  professional: "profesional",
  business: "negocio",
  intermedio: "negocio",
  intermediate: "negocio",
  pro: "negocio",
};

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function resolvePosSecret() {
  return String(process.env.API_SECRET_KEY || process.env.API_INGEST_SECRET || "").trim();
}

function isPosBearer(req: { headers: Record<string, string | string[] | undefined> }) {
  const secret = resolvePosSecret();
  if (!secret) return false;
  const auth = String(req.headers.authorization || "");
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  return bearer === secret || apiKey === secret;
}

function normalizePlans(raw: unknown) {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
  const set: string[] = [];
  for (const item of list) {
    const s = String(item || "").trim().toLowerCase().replace(/^plan\s+/, "");
    const key = PLAN_ALIASES[s] || s;
    if ((PLAN_KEYS as readonly string[]).includes(key) && !set.includes(key)) set.push(key);
  }
  return set;
}

function parseExpiry(body: Record<string, unknown>) {
  const explicit = clip(body.expires_at ?? body.expiresAt, 40);
  if (explicit) {
    const parsed = new Date(explicit);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const hours = Number(body.duration_hours ?? body.durationHours);
  if (Number.isFinite(hours) && hours > 0) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  return null;
}

function toPublic(row: {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  audience: string;
  plans: unknown;
  expiresAt: Date | null;
  createdBy: string;
  restaurantName: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const plans = normalizePlans(row.plans);
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    image_url: row.imageUrl,
    audience: row.audience === "plans" ? "plans" : "all",
    target_plans: plans,
    expires_at: row.expiresAt ? row.expiresAt.toISOString() : null,
    created_by: row.createdBy,
    restaurant_name: row.restaurantName,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

async function purgeExpiredNotices() {
  await prisma.platformNotice.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}

function readBody(req: { body?: unknown }) {
  return (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
}

export const noticesRouter = Router();

noticesRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    await purgeExpiredNotices();
    const rows = await prisma.platformNotice.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ notices: rows.map(toPublic) });
  } catch (err) {
    sendApiError(res, err);
  }
});

noticesRouter.get("/for-pos", async (req, res) => {
  if (!resolvePosSecret()) {
    res.status(503).json({ error: "El panel no tiene API_SECRET_KEY ni API_INGEST_SECRET." });
    return;
  }
  if (!isPosBearer(req)) {
    res.status(401).json({ error: "API key inválida" });
    return;
  }
  try {
    await purgeExpiredNotices();
    const plan = normalizePlans([req.query.plan])[0] || "";
    const rows = await prisma.platformNotice.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const notices = rows
      .map(toPublic)
      .filter((n) => n.audience !== "plans" || (plan && n.target_plans.includes(plan)));
    res.json({ notices });
  } catch (err) {
    sendApiError(res, err);
  }
});

noticesRouter.post("/", async (req, res) => {
  const fromPos = isPosBearer(req);
  if (!fromPos) {
    requireAdmin(req, res, () => {
      void createNotice(req, res, "Web central");
    });
    return;
  }
  await createNotice(req, res, clip(readBody(req).created_by, 120) || "Resto FADEY");
});

async function createNotice(req: Request, res: Response, createdBy: string) {
  try {
    const body = readBody(req);
    const title = clip(body.title, 180);
    const message = clip(body.message, 4000);
    if (!title || !message) {
      res.status(400).json({ error: "Título y mensaje son obligatorios" });
      return;
    }
    const audience = body.audience === "plans" ? "plans" : "all";
    const plans = audience === "plans" ? normalizePlans(body.target_plans ?? body.plans) : [];
    if (audience === "plans" && !plans.length) {
      res.status(400).json({ error: "Elige al menos un plan" });
      return;
    }
    const saved = await prisma.platformNotice.create({
      data: {
        title,
        message,
        imageUrl: clip(body.image_url ?? body.imageUrl, 500),
        audience,
        plans,
        expiresAt: parseExpiry(body),
        createdBy: clip(body.created_by, 120) || createdBy,
        restaurantName: clip(body.restaurantName, 160),
        sourceUrl: clip(body.sourceWebServiceUrl, 300),
      },
    });
    res.status(201).json({ id: saved.id, notice: toPublic(saved) });
  } catch (err) {
    sendApiError(res, err);
  }
}

noticesRouter.post("/:id", async (req, res) => {
  const fromPos = isPosBearer(req);
  if (!fromPos) {
    requireAdmin(req, res, () => {
      void updateNotice(req, res);
    });
    return;
  }
  await updateNotice(req, res);
});

async function updateNotice(req: Request, res: Response) {
  try {
    const body = readBody(req);
    const title = clip(body.title, 180);
    const message = clip(body.message, 4000);
    if (!title || !message) {
      res.status(400).json({ error: "Título y mensaje son obligatorios" });
      return;
    }
    const audience = body.audience === "plans" ? "plans" : "all";
    const plans = audience === "plans" ? normalizePlans(body.target_plans ?? body.plans) : [];
    if (audience === "plans" && !plans.length) {
      res.status(400).json({ error: "Elige al menos un plan" });
      return;
    }
    const saved = await prisma.platformNotice.update({
      where: { id: String(req.params.id) },
      data: {
        title,
        message,
        imageUrl: clip(body.image_url ?? body.imageUrl, 500),
        audience,
        plans,
        expiresAt: parseExpiry(body),
        createdBy: clip(body.created_by, 120) || undefined,
      },
    });
    res.json({ id: saved.id, notice: toPublic(saved) });
  } catch (err) {
    sendApiError(res, err);
  }
}

noticesRouter.post("/:id/delete", async (req, res) => {
  const fromPos = isPosBearer(req);
  if (!fromPos) {
    requireAdmin(req, res, () => {
      void removeNotice(req, res);
    });
    return;
  }
  await removeNotice(req, res);
});

noticesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await removeNotice(req, res);
});

async function removeNotice(req: Request, res: Response) {
  try {
    await prisma.platformNotice.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    sendApiError(res, err);
  }
}
