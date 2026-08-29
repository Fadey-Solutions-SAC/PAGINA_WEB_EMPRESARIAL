/**
 * POST /api/payments — compatible con Resto FADEY POS (Bearer + JSON voucherUrl).
 * El panel admin usa el mismo path con JWT; este handler solo actúa si el Bearer coincide.
 */
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { prisma, uploadsDir } from "../db.js";
import { sendApiError } from "../utils/errors.js";

const posLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
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

function periodFromBody(body: Record<string, unknown>) {
  const explicit = String(body.period || body.periodoFacturacion || "").trim();
  if (explicit) return explicit.slice(0, 80);
  const paymentDate = String(body.paymentDate || body.fecha || "").trim();
  if (/^\d{4}-\d{2}/.test(paymentDate)) return paymentDate.slice(0, 7);
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function findLinkedUser(body: Record<string, unknown>) {
  const clientId = String(body.clientId || "").trim();
  const licenseKey = String(
    body.licenseKey || body.webServiceId || "",
  ).trim();
  const sourceUrl = normalizeBaseUrl(
    String(body.sourceWebServiceUrl || "").trim(),
  );

  if (clientId) {
    const byId = await prisma.clientUser.findUnique({ where: { id: clientId } });
    if (byId?.active) return byId;
    const byLicense = await prisma.clientUser.findUnique({
      where: { licenseKey: clientId },
    });
    if (byLicense?.active) return byLicense;
  }

  if (licenseKey) {
    const byLicense = await prisma.clientUser.findUnique({
      where: { licenseKey },
    });
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

async function downloadReceipt(voucherUrl: string) {
  const url = String(voucherUrl || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("voucherUrl debe ser una URL pública http(s)");
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "image/*,application/pdf" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el comprobante (${res.status})`);
  }

  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  let ext = ".png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
  else if (contentType.includes("pdf")) ext = ".pdf";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("png")) ext = ".png";

  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("El comprobante descargado está vacío");
  if (buf.length > 5 * 1024 * 1024) {
    throw new Error("El comprobante supera 5 MB");
  }

  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const fullPath = path.join(uploadsDir, filename);
  fs.writeFileSync(fullPath, buf);
  return `/uploads/${filename}`;
}

export const posPaymentsRouter = Router();

posPaymentsRouter.post("/", posLimit, async (req, res, next) => {
  if (!isPosBearer(req)) {
    next();
    return;
  }

  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const voucherUrl = String(body.voucherUrl || body.voucher || "").trim();
    const amountRaw = body.amount != null ? Number(body.amount) : body.monto;
    const amount = Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : null;

    if (!voucherUrl) {
      res.status(400).json({ error: "voucherUrl es requerido" });
      return;
    }
    if (amount == null || amount <= 0) {
      res.status(400).json({ error: "amount debe ser un número mayor a 0" });
      return;
    }

    const user = await findLinkedUser(body);
    if (!user) {
      res.status(404).json({
        error:
          "Cliente no vinculado. En Render del POS configure CLIENT_ID con el ID/licencia del panel Fadey.",
      });
      return;
    }

    const receiptPath = await downloadReceipt(voucherUrl);
    const clientName =
      String(body.restaurantName || body.restaurante || user.clientName || "").trim()
      || user.clientName;
    const period = periodFromBody(body);

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        clientName,
        period,
        amount,
        receiptPath,
        source: "ingest",
        status: "pending",
      },
    });

    res.status(201).json({
      ok: true,
      paymentId: payment.id,
      clientId: user.id,
      licenseKey: user.licenseKey,
      status: payment.status,
      period: payment.period,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});
