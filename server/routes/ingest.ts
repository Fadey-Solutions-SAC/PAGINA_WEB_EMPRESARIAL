import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, uploadsDir } from "../db.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/png") cb(null, true);
    else cb(new Error("Solo se permiten archivos PNG"));
  },
});

const ingestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const ingestRouter = Router();

ingestRouter.post(
  "/payments",
  ingestLimit,
  upload.single("receipt"),
  async (req, res) => {
    const apiKey = String(req.headers["x-api-key"] || "");
    const expected = process.env.API_INGEST_SECRET || "";
    if (!expected || apiKey !== expected) {
      res.status(401).json({ error: "API key inválida" });
      return;
    }

    const userId = String(req.body?.userId || "").trim();
    const clientName = String(req.body?.clientName || "").trim();
    const period = String(req.body?.period || "").trim();
    const amount = req.body?.amount ? Number(req.body.amount) : null;

    if (!userId || !clientName || !period || !req.file) {
      res.status(400).json({
        error: "userId, clientName, period y receipt (PNG) son requeridos",
      });
      return;
    }

    const user = await prisma.clientUser.findUnique({ where: { id: userId } });
    if (!user || !user.active) {
      res.status(404).json({ error: "userId no vinculado o inactivo" });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        clientName,
        period,
        amount: Number.isFinite(amount) ? amount : null,
        receiptPath: `/uploads/${req.file.filename}`,
        source: "ingest",
      },
    });

    res.status(201).json({
      ok: true,
      paymentId: payment.id,
      userId: payment.userId,
      period: payment.period,
    });
  },
);
