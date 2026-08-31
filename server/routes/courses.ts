import { Router } from "express";
import type { CourseKind, Product } from "@prisma/client";
import { prisma } from "../db.js";
import {
  requireAdmin,
  requireClient,
  type AuthedRequest,
} from "../middleware/auth.js";
import { youtubeEmbed } from "../utils/youtube.js";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);
const KINDS = new Set(["tutorial", "academia"]);

export const coursesRouter = Router();

coursesRouter.get("/", requireClient, async (req: AuthedRequest, res) => {
  if (req.auth?.role === "admin") {
    const courses = await prisma.courseModule.findMany({
      orderBy: [{ product: "asc" }, { kind: "asc" }, { sortOrder: "asc" }],
    });
    res.json(courses.map((c) => ({ ...c, embedUrl: youtubeEmbed(c.youtubeUrl) })));
    return;
  }

  const products = req.auth?.role === "client" ? req.auth.products : [];
  const courses = await prisma.courseModule.findMany({
    where: { product: { in: products } },
    orderBy: [{ product: "asc" }, { kind: "asc" }, { sortOrder: "asc" }],
  });
  res.json(courses.map((c) => ({ ...c, embedUrl: youtubeEmbed(c.youtubeUrl) })));
});

coursesRouter.post("/", requireAdmin, async (req, res) => {
  const product = String(req.body?.product || "") as Product;
  const kind = String(req.body?.kind || "") as CourseKind;
  const title = String(req.body?.title || "").trim();
  const youtubeUrl = String(req.body?.youtubeUrl || "").trim();
  const sortOrder = Number(req.body?.sortOrder || 0);

  if (!PRODUCTS.has(product) || !KINDS.has(kind) || !title || !youtubeUrl) {
    res.status(400).json({ error: "Datos de curso incompletos" });
    return;
  }

  const course = await prisma.courseModule.create({
    data: { product, kind, title, youtubeUrl, sortOrder },
  });
  res.status(201).json({ ...course, embedUrl: youtubeEmbed(course.youtubeUrl) });
});

coursesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  await prisma.courseModule.delete({ where: { id } });
  res.json({ ok: true });
});
