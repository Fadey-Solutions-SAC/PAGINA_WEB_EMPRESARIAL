import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Product } from "@prisma/client";

export type JwtPayload =
  | { role: "admin" }
  | { role: "client"; userId: string; products: Product[] };

export type AuthedRequest = Request & { auth?: JwtPayload };

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET no configurado");
  return s;
};

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  try {
    req.auth = jwt.verify(token, secret()) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "admin") {
      res.status(403).json({ error: "Solo admin" });
      return;
    }
    next();
  });
}

export function requireClient(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "client" && req.auth?.role !== "admin") {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    next();
  });
}
