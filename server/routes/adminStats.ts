import { Router } from "express";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

export const adminStatsRouter = Router();

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
