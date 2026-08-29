import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, uploadsDir } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";
import {
  computeNextExpiration,
  notifyPosPaymentDecision,
  posNotifyUserMessage,
} from "../utils/posNotify.js";
import {
  recordApprovedPaymentIncome,
  removePaymentIncome,
} from "../utils/financeLedger.js";

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
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { receivedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            clientName: true,
            licenseKey: true,
            webServiceUrl: true,
          },
        },
      },
    });
    res.json(payments);
  } catch (err) {
    sendApiError(res, err);
  }
});

paymentsRouter.post("/:id/notify-pos", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            clientName: true,
            licenseKey: true,
            webServiceUrl: true,
          },
        },
      },
    });
    if (!payment) {
      res.status(404).json({ error: "Pago no encontrado" });
      return;
    }
    if (payment.status !== "approved" && payment.status !== "rejected") {
      res.status(400).json({
        error: "Solo se puede notificar al POS pagos aprobados o rechazados",
      });
      return;
    }

    const posNotify = await notifyPosPaymentDecision(
      payment.user,
      payment.status,
      {
        paymentId: payment.id,
        period: payment.period,
        expirationDate:
          payment.status === "approved"
            ? computeNextExpiration(payment.period)
            : undefined,
      },
    );

    res.json({
      payment,
      posNotify,
      message: posNotifyUserMessage(posNotify, payment.status),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

paymentsRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const status = String(req.body?.status || "");
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      res.status(400).json({ error: "status debe ser approved, rejected o pending" });
      return;
    }
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        reviewedAt: status === "pending" ? null : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            clientName: true,
            licenseKey: true,
            webServiceUrl: true,
          },
        },
      },
    });

    let posNotify = null;
    if (status === "approved" || status === "rejected") {
      if (status === "approved") {
        await recordApprovedPaymentIncome({
          id: payment.id,
          clientName: payment.clientName,
          amount: payment.amount,
        });
      } else {
        await removePaymentIncome(payment.id);
      }
      posNotify = await notifyPosPaymentDecision(payment.user, status, {
        paymentId: payment.id,
        period: payment.period,
        expirationDate:
          status === "approved"
            ? computeNextExpiration(payment.period)
            : undefined,
      });
    }

    res.json({
      ...payment,
      posNotify,
      message: posNotify
        ? posNotifyUserMessage(posNotify, status)
        : undefined,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

paymentsRouter.post(
  "/",
  requireAdmin,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const userId = String(req.body?.userId || "").trim();
      const clientName = String(req.body?.clientName || "").trim();
      const period = String(req.body?.period || "").trim();
      const amount = req.body?.amount ? Number(req.body.amount) : null;

      if (!userId || !clientName || !period || !req.file) {
        res
          .status(400)
          .json({ error: "userId, clientName, period y PNG requeridos" });
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
          status: "approved",
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              clientName: true,
              licenseKey: true,
              webServiceUrl: true,
            },
          },
        },
      });

      const posNotify = await notifyPosPaymentDecision(payment.user, "approved", {
        paymentId: payment.id,
        period: payment.period,
        expirationDate: computeNextExpiration(payment.period),
      });

      await recordApprovedPaymentIncome({
        id: payment.id,
        clientName: payment.clientName,
        amount: payment.amount,
      });

      res.status(201).json({
        ...payment,
        posNotify,
        message: posNotifyUserMessage(posNotify, "approved"),
      });
    } catch (err) {
      sendApiError(res, err);
    }
  },
);
