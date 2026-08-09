import { Router } from "express";
import { prisma } from "../db.js";
import {
  requireClient,
  type AuthedRequest,
} from "../middleware/auth.js";

export const progressRouter = Router();

progressRouter.get("/", requireClient, async (req: AuthedRequest, res) => {
  if (req.auth?.role === "admin") {
    const all = await prisma.progress.findMany({
      include: {
        user: { select: { id: true, username: true, clientName: true } },
        module: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(all);
    return;
  }

  const userId = req.auth?.role === "client" ? req.auth.userId : "";
  const rows = await prisma.progress.findMany({
    where: { userId },
    include: { module: true },
  });
  res.json(rows);
});

progressRouter.post("/:moduleId", requireClient, async (req: AuthedRequest, res) => {
  if (req.auth?.role !== "client") {
    res.status(403).json({ error: "Solo clientes marcan progreso" });
    return;
  }

  const moduleId = String(req.params.moduleId);
  const completed = req.body?.completed !== false;
  const module = await prisma.courseModule.findUnique({ where: { id: moduleId } });
  if (!module) {
    res.status(404).json({ error: "Módulo no encontrado" });
    return;
  }
  if (!req.auth.products.includes(module.product)) {
    res.status(403).json({ error: "Sin acceso a este módulo" });
    return;
  }

  const row = await prisma.progress.upsert({
    where: {
      userId_moduleId: { userId: req.auth.userId, moduleId },
    },
    create: {
      userId: req.auth.userId,
      moduleId,
      completed,
    },
    update: { completed },
  });
  res.json(row);
});
