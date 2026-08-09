import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Product } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);

function genUsername(clientName: string) {
  const base = clientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12) || "cliente";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const usersRouter = Router();

usersRouter.get("/", requireAdmin, async (_req, res) => {
  const users = await prisma.clientUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      clientName: true,
      products: true,
      active: true,
      createdAt: true,
      _count: { select: { payments: true } },
    },
  });
  res.json(users);
});

usersRouter.post("/link", requireAdmin, async (req, res) => {
  const clientName = String(req.body?.clientName || "").trim();
  const leadId = req.body?.leadId ? String(req.body.leadId) : null;
  const productsRaw = Array.isArray(req.body?.products) ? req.body.products : [];
  const products = productsRaw.filter((p: string) => PRODUCTS.has(p)) as Product[];

  if (!clientName || products.length === 0) {
    res.status(400).json({ error: "Nombre y al menos un producto requeridos" });
    return;
  }

  let username = String(req.body?.username || "").trim() || genUsername(clientName);
  const password = String(req.body?.password || "").trim() || genPassword();

  const existing = await prisma.clientUser.findUnique({ where: { username } });
  if (existing) {
    username = genUsername(clientName);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.clientUser.create({
    data: {
      username,
      passwordHash,
      clientName,
      products,
    },
  });

  if (leadId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { linkedUserId: user.id },
    });
  }

  res.status(201).json({
    id: user.id,
    username: user.username,
    password,
    clientName: user.clientName,
    products: user.products,
    note: "Guarda la contraseña ahora; no se volverá a mostrar.",
  });
});

usersRouter.patch("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const data: {
    clientName?: string;
    products?: Product[];
    active?: boolean;
    passwordHash?: string;
  } = {};

  if (req.body?.clientName) data.clientName = String(req.body.clientName).trim();
  if (Array.isArray(req.body?.products)) {
    data.products = req.body.products.filter((p: string) =>
      PRODUCTS.has(p),
    ) as Product[];
  }
  if (typeof req.body?.active === "boolean") data.active = req.body.active;
  if (req.body?.password) {
    data.passwordHash = await bcrypt.hash(String(req.body.password), 10);
  }

  const user = await prisma.clientUser.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      clientName: true,
      products: true,
      active: true,
    },
  });
  res.json(user);
});
