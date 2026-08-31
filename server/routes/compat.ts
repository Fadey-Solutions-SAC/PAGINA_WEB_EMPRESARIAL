import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { PaymentStatus } from "@prisma/client";
import { prisma, uploadsDir } from "../db.js";
import { sendApiError } from "../utils/errors.js";
import {
  FADEY_POLICY_SUSPENSION_MESSAGE,
} from "../utils/policySuspension.js";

export const compatRouter = Router();

function verifyPosSecret(req: { headers: Record<string, unknown> }) {
  const expected = process.env.API_INGEST_SECRET || "";
  if (!expected) return false;
  const bearer = String(req.headers.authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  return bearer === expected || apiKey === expected;
}

function posAuth(
  req: { headers: Record<string, unknown> },
  res: { status: (n: number) => { json: (b: unknown) => void } },
  next: () => void,
) {
  if (!verifyPosSecret(req)) {
    res.status(401).json({ error: "API key inválida" });
    return;
  }
  next();
}

function resolveClientRef(req: {
  body?: Record<string, unknown>;
  headers: Record<string, unknown>;
  params?: Record<string, string>;
}) {
  return String(
    req.body?.clientId ||
      req.headers["x-client-id"] ||
      req.headers["x-license-key"] ||
      req.params?.clientId ||
      "",
  ).trim();
}

async function findLinkedUser(clientRef: string) {
  if (!clientRef) return null;
  return (
    (await prisma.clientUser.findUnique({ where: { id: clientRef } })) ||
    (await prisma.clientUser.findUnique({ where: { licenseKey: clientRef } }))
  );
}

function mapEstado(status: PaymentStatus) {
  return status;
}

function paymentPayload(payment: {
  id: string;
  status: PaymentStatus;
  referencia: string | null;
  reviewedAt: Date | null;
  receivedAt: Date;
  period: string;
  amount: number | null;
}) {
  const estado = mapEstado(payment.status);
  const updatedAt = (payment.reviewedAt || payment.receivedAt).toISOString();
  return {
    id: payment.id,
    referencia: payment.referencia || "",
    estado,
    status: estado,
    paymentStatus: estado,
    period: payment.period,
    amount: payment.amount,
    updated_at: updatedAt,
  };
}

async function downloadVoucherToUploads(voucherUrl: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(voucherUrl, {
      signal: controller.signal,
      headers: { Accept: "image/*,application/pdf,*/*" },
    });
    if (!res.ok) {
      throw new Error(`No se pudo descargar comprobante (${res.status})`);
    }
    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    const lowerUrl = voucherUrl.toLowerCase();
    let ext = ".png";
    if (contentType.includes("pdf") || lowerUrl.endsWith(".pdf")) ext = ".pdf";
    else if (
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      lowerUrl.endsWith(".jpg") ||
      lowerUrl.endsWith(".jpeg")
    ) {
      ext = ".jpg";
    } else if (contentType.includes("png") || lowerUrl.endsWith(".png")) {
      ext = ".png";
    }

    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error("Comprobante vacío");
    fs.writeFileSync(filePath, buf);
    return `/uploads/${filename}`;
  } finally {
    clearTimeout(timer);
  }
}

compatRouter.post("/payments", posAuth, async (req, res) => {
  try {
    const clientRef = resolveClientRef(req);
    const clientName = String(
      req.body?.restaurantName || req.body?.clientName || "",
    ).trim();
    const voucherUrl = String(req.body?.voucherUrl || req.body?.receiptUrl || "").trim();
    const referencia = String(
      req.body?.operationNumber || req.body?.referencia || "",
    ).trim();
    const paymentDate = String(req.body?.paymentDate || "").trim();
    const period =
      paymentDate.slice(0, 7) ||
      paymentDate ||
      new Date().toISOString().slice(0, 7);
    const amountRaw = req.body?.amount;
    const amount =
      amountRaw != null && Number.isFinite(Number(amountRaw))
        ? Number(amountRaw)
        : null;

    if (!clientRef || !clientName || !voucherUrl) {
      res.status(400).json({
        error: "clientId, restaurantName y voucherUrl son requeridos",
      });
      return;
    }

    const user = await findLinkedUser(clientRef);
    if (!user || !user.active) {
      res.status(404).json({
        error: "clientId no registrado en el panel o inactivo",
      });
      return;
    }

    if (referencia) {
      const existing = await prisma.payment.findFirst({
        where: { userId: user.id, referencia },
        orderBy: { receivedAt: "desc" },
      });
      if (existing) {
        res.status(200).json({
          ok: true,
          paymentId: existing.id,
          payment: paymentPayload(existing),
        });
        return;
      }
    }

    const receiptPath = await downloadVoucherToUploads(voucherUrl);
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        clientName,
        period,
        referencia: referencia || null,
        amount,
        receiptPath,
        source: "ingest",
        status: "pending",
      },
    });

    res.status(201).json({
      ok: true,
      paymentId: payment.id,
      userId: payment.userId,
      clientId: user.id,
      licenseKey: user.licenseKey,
      payment: paymentPayload(payment),
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("descargar comprobante")) {
      res.status(400).json({ error: err.message });
      return;
    }
    sendApiError(res, err);
  }
});

compatRouter.get("/payments/status", posAuth, async (req, res) => {
  try {
    const clientRef = resolveClientRef(req);
    const referencia = String(req.query.referencia || "").trim();
    const user = await findLinkedUser(clientRef);
    if (!user) {
      res.status(404).json({ error: "clientId no registrado en el panel" });
      return;
    }

    let payment = null;
    if (referencia) {
      payment = await prisma.payment.findFirst({
        where: { userId: user.id, referencia },
        orderBy: { receivedAt: "desc" },
      });
    } else {
      payment = await prisma.payment.findFirst({
        where: { userId: user.id },
        orderBy: { receivedAt: "desc" },
      });
    }

    if (!payment) {
      res.json({
        ok: true,
        payment: null,
        referencia: referencia || null,
        estado: null,
      });
      return;
    }

    res.json({
      ok: true,
      payment: paymentPayload(payment),
      referencia: payment.referencia,
      estado: mapEstado(payment.status),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

compatRouter.get("/license-status/:clientId", posAuth, async (req, res) => {
  try {
    const clientRef = String(req.params.clientId || "").trim();
    const user = await findLinkedUser(clientRef);
    if (!user) {
      res.status(404).json({ error: "clientId no registrado en el panel" });
      return;
    }

    if (!user.active) {
      res.json({
        ok: true,
        licenseStatus: "suspendido",
        policySuspended: true,
        suspensionMessage: FADEY_POLICY_SUSPENSION_MESSAGE,
        clientId: user.id,
        licenseKey: user.licenseKey,
        payment: null,
      });
      return;
    }

    const latestPending = await prisma.payment.findFirst({
      where: { userId: user.id, status: "pending" },
      orderBy: { receivedAt: "desc" },
    });
    const latestApproved = await prisma.payment.findFirst({
      where: { userId: user.id, status: "approved" },
      orderBy: { reviewedAt: "desc" },
    });

    let licenseStatus = user.active ? "activo" : "suspendido";
    if (latestPending) licenseStatus = "pendiente";

    res.json({
      ok: true,
      licenseStatus,
      clientId: user.id,
      licenseKey: user.licenseKey,
      payment: latestPending
        ? paymentPayload(latestPending)
        : latestApproved
          ? paymentPayload(latestApproved)
          : null,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

compatRouter.post("/clients/profile", posAuth, async (req, res) => {
  try {
    const clientRef = resolveClientRef(req);
    const user = await findLinkedUser(clientRef);
    if (!user) {
      res.status(404).json({ error: "clientId no registrado en el panel" });
      return;
    }

    const restaurantName = String(req.body?.restaurantName || "").trim();
    const ownerName = String(req.body?.ownerName || "").trim();
    const email = String(req.body?.email || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const ruc = String(req.body?.ruc || "").trim();
    const renderUrl = String(req.body?.renderUrl || "").trim();

    const restaurantData = {
      ...(typeof user.restaurantData === "object" && user.restaurantData
        ? (user.restaurantData as Record<string, unknown>)
        : {}),
      name: restaurantName || user.clientName,
      ownerName: ownerName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      ruc: ruc || undefined,
      renderUrl: renderUrl || undefined,
      plan: req.body?.plan,
      licenseStatus: req.body?.licenseStatus,
      lastActivity: req.body?.lastActivity,
    };

    await prisma.clientUser.update({
      where: { id: user.id },
      data: {
        clientName: restaurantName || user.clientName,
        restaurantData,
        webServiceUrl: renderUrl || user.webServiceUrl,
      },
    });

    res.json({ ok: true, clientId: user.id, message: "Perfil sincronizado" });
  } catch (err) {
    sendApiError(res, err);
  }
});
