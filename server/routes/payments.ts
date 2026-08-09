import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, uploadsDir } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

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

export const paymentsRouter = Router();

paymentsRouter.get("/", requireAdmin, async (_req, res) => {
  const payments = await prisma.payment.findMany({
    orderBy: { receivedAt: "desc" },
    include: {
      user: { select: { id: true, username: true, clientName: true } },
    },
  });
  res.json(payments);
});

paymentsRouter.post(
  "/",
  requireAdmin,
  upload.single("receipt"),
  async (req, res) => {
    const userId = String(req.body?.userId || "").trim();
    const clientName = String(req.body?.clientName || "").trim();
    const period = String(req.body?.period || "").trim();
    const amount = req.body?.amount ? Number(req.body.amount) : null;

    if (!userId || !clientName || !period || !req.file) {
      res.status(400).json({ error: "userId, clientName, period y PNG requeridos" });
      return;
    }

    const user = await prisma.clientUser.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        clientName,
        period,
        amount: Number.isFinite(amount) ? amount : null,
        receiptPath: `/uploads/${req.file.filename}`,
        source: "admin",
      },
    });
    res.status(201).json(payment);
  },
);
