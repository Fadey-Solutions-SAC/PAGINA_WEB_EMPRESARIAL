import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { ClaimGoods, ClaimKind, ClaimStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

const DOC_TYPES = new Set(["DNI", "CE", "PASAPORTE", "RUC"]);
const GOODS = new Set(["producto", "servicio"]);
const KINDS = new Set(["reclamo", "queja"]);
const STATUSES = new Set(["pendiente", "atendido", "cerrado"]);

const submitLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
});

function nextFolio() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `LR-${year}-${suffix}`;
}

export const reclamacionesRouter = Router();

reclamacionesRouter.post("/", submitLimit, async (req, res) => {
  try {
    const consumerName = String(req.body?.consumerName || "").trim();
    const documentType = String(req.body?.documentType || "")
      .trim()
      .toUpperCase();
    const documentNumber = String(req.body?.documentNumber || "")
      .trim()
      .toUpperCase();
    const address = String(req.body?.address || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const guardianName = String(req.body?.guardianName || "").trim() || null;
    const goodsType = String(req.body?.goodsType || "").trim() as ClaimGoods;
    const goodsDescription = String(req.body?.goodsDescription || "").trim();
    const claimKind = String(req.body?.claimKind || "").trim() as ClaimKind;
    const detail = String(req.body?.detail || "").trim();
    const request = String(req.body?.request || "").trim();
    const amountRaw = req.body?.claimedAmount;
    const claimedAmount =
      amountRaw === "" || amountRaw == null
        ? null
        : Number(amountRaw);

    if (
      !consumerName ||
      !DOC_TYPES.has(documentType) ||
      !documentNumber ||
      !address ||
      !phone ||
      !email ||
      !GOODS.has(goodsType) ||
      !goodsDescription ||
      !KINDS.has(claimKind) ||
      !detail ||
      !request
    ) {
      res.status(400).json({
        error: "Completa todos los campos obligatorios del libro de reclamaciones",
      });
      return;
    }

    if (claimedAmount != null && (!Number.isFinite(claimedAmount) || claimedAmount < 0)) {
      res.status(400).json({ error: "El monto reclamado no es válido" });
      return;
    }

    let folio = nextFolio();
    for (let i = 0; i < 5; i += 1) {
      const exists = await prisma.reclamacion.findUnique({ where: { folio } });
      if (!exists) break;
      folio = nextFolio();
    }

    const row = await prisma.reclamacion.create({
      data: {
        folio,
        consumerName,
        documentType,
        documentNumber,
        address,
        phone,
        email,
        guardianName,
        goodsType,
        goodsDescription,
        claimedAmount,
        claimKind,
        detail,
        request,
      },
    });

    res.status(201).json({
      id: row.id,
      folio: row.folio,
      createdAt: row.createdAt,
      message:
        "Reclamación registrada. Guarda tu número de folio para el seguimiento.",
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

reclamacionesRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const rows = await prisma.reclamacion.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  } catch (err) {
    sendApiError(res, err);
  }
});

reclamacionesRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const status = String(req.body?.status || "").trim() as ClaimStatus;
    if (!STATUSES.has(status)) {
      res.status(400).json({ error: "Estado inválido" });
      return;
    }
    const row = await prisma.reclamacion.update({
      where: { id },
      data: { status },
    });
    res.json(row);
  } catch (err) {
    sendApiError(res, err);
  }
});
