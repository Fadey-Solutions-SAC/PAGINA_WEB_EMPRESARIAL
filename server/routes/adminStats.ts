import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { prisma, uploadsDir } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

export const adminStatsRouter = Router();

const WIPE_TARGETS = new Set(["payments", "users", "leads", "finance", "all"]);

async function deletePaymentFiles() {
  const payments = await prisma.payment.findMany({
    select: { receiptPath: true },
  });
  for (const payment of payments) {
    const filename = path.basename(payment.receiptPath);
    const filePath = path.join(uploadsDir, filename);
    try {
      fs.unlinkSync(filePath);
    } catch {
      /* archivo ya eliminado o inexistente */
    }
  }
}

async function wipePayments() {
  await deletePaymentFiles();
  return prisma.payment.deleteMany();
}

async function wipeUsers() {
  await deletePaymentFiles();
  await prisma.progress.deleteMany();
  await prisma.lead.updateMany({ data: { linkedUserId: null } });
  return prisma.clientUser.deleteMany();
}

async function wipeLeads() {
  await prisma.lead.updateMany({ data: { linkedUserId: null } });
  return prisma.lead.deleteMany();
}

adminStatsRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [leadsWeek, usersActive, paymentsMonth, courses, leadsTotal, usersTotal] =
      await Promise.all([
        prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.clientUser.count({ where: { active: true } }),
        prisma.payment.count({ where: { receivedAt: { gte: monthStart } } }),
        prisma.courseModule.count(),
        prisma.lead.count(),
        prisma.clientUser.count(),
      ]);

    res.json({
      leadsWeek,
      usersActive,
      paymentsMonth,
      courses,
      leadsTotal,
      usersTotal,
      unlinkedLeads: await prisma.lead.count({ where: { linkedUserId: null } }),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

adminStatsRouter.post("/wipe", requireAdmin, async (req, res) => {
  try {
    const target = String(req.body?.target || "");
    const confirm = String(req.body?.confirm || "");
    if (confirm !== "BORRAR") {
      res.status(400).json({ error: 'Escribe confirm: "BORRAR" para continuar' });
      return;
    }
    if (!WIPE_TARGETS.has(target)) {
      res.status(400).json({
        error: "target debe ser payments, users, leads, finance o all",
      });
      return;
    }

    let deleted: Record<string, number> = {};

    if (target === "payments" || target === "all") {
      const result = await wipePayments();
      deleted.payments = result.count;
      const finance = await prisma.financeEntry.deleteMany({
        where: { paymentId: { not: null } },
      });
      deleted.financeFromPayments = finance.count;
    }
    if (target === "finance" || target === "all") {
      const result = await prisma.financeEntry.deleteMany();
      deleted.finance = result.count;
    }
    if (target === "users" || target === "all") {
      const result = await wipeUsers();
      deleted.users = result.count;
    }
    if (target === "leads" || target === "all") {
      const result = await wipeLeads();
      deleted.leads = result.count;
    }

    res.json({
      ok: true,
      target,
      deleted,
      note:
        "Los ingresos/egresos del POS Resto se borran desde el agente del web service, no desde aquí.",
    });
  } catch (err) {
    sendApiError(res, err);
  }
});
