import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { signToken, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/admin", loginLimit, async (req, res) => {
  const password = String(req.body?.password || "").trim();
  const expected = String(process.env.ADMIN_PASSWORD || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!expected || password !== expected) {
    res.status(401).json({ error: "Contraseña incorrecta" });
    return;
  }
  const token = signToken({ role: "admin" });
  res.json({ token, role: "admin", name: "Admin" });
});

authRouter.post("/login", loginLimit, async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }
  const user = await prisma.clientUser.findUnique({ where: { username } });
  if (!user || !user.active) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const token = signToken({
    role: "client",
    userId: user.id,
    products: user.products,
  });
  res.json({
    token,
    role: "client",
    userId: user.id,
    username: user.username,
    clientName: user.clientName,
    products: user.products,
  });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  if (req.auth?.role === "admin") {
    res.json({ role: "admin", name: "Admin" });
    return;
  }
  if (req.auth?.role === "client") {
    const user = await prisma.clientUser.findUnique({
      where: { id: req.auth.userId },
    });
    if (!user || !user.active) {
      res.status(401).json({ error: "Usuario inactivo" });
      return;
    }
    res.json({
      role: "client",
      userId: user.id,
      username: user.username,
      clientName: user.clientName,
      products: user.products,
    });
    return;
  }
  res.status(401).json({ error: "No autenticado" });
});
