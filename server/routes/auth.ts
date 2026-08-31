import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { signToken, requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asProducts } from "../utils/products.js";
import { normalizeCredential } from "../utils/credentials.js";
import {
  FADEY_POLICY_SUSPENSION_CODE,
  FADEY_POLICY_SUSPENSION_MESSAGE,
} from "../utils/policySuspension.js";

export const authRouter = Router();

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/admin", loginLimit, async (req, res) => {
  try {
    const password = String(req.body?.password || "").trim();
    const expected = String(process.env.ADMIN_PASSWORD || "ROMERO25879")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!password || password !== expected) {
      res.status(401).json({ error: "Contraseña incorrecta" });
      return;
    }
    const token = signToken({ role: "admin" });
    res.json({ token, role: "admin", name: "Admin" });
  } catch (err) {
    console.error("admin login error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Error al iniciar sesión",
    });
  }
});

authRouter.post("/login", loginLimit, async (req, res) => {
  const rawUsername = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!rawUsername || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }
  const upperUsername = normalizeCredential(rawUsername);
  let user = await prisma.clientUser.findUnique({ where: { username: upperUsername } });
  if (!user && rawUsername !== upperUsername) {
    user = await prisma.clientUser.findUnique({ where: { username: rawUsername } });
  }
  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  if (!user.active) {
    res.status(403).json({
      error: FADEY_POLICY_SUSPENSION_MESSAGE,
      code: FADEY_POLICY_SUSPENSION_CODE,
    });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const products = asProducts(user.products);
  const token = signToken({
    role: "client",
    userId: user.id,
    products,
  });
  res.json({
    token,
    role: "client",
    userId: user.id,
    username: user.username,
    clientName: user.clientName,
    products,
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
    const impersonated =
      req.auth.role === "client" && req.auth.impersonated === true;
    if (!user || (!user.active && !impersonated)) {
      res.status(403).json({
        error: FADEY_POLICY_SUSPENSION_MESSAGE,
        code: FADEY_POLICY_SUSPENSION_CODE,
      });
      return;
    }
    res.json({
      role: "client",
      userId: user.id,
      username: user.username,
      clientName: user.clientName,
      products: asProducts(user.products),
      impersonating: impersonated,
    });
    return;
  }
  res.status(401).json({ error: "No autenticado" });
});
