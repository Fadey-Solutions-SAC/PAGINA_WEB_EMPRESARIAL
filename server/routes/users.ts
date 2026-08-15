import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { Prisma, Product } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";
import { asProducts } from "../utils/products.js";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);

function genUsername(clientName: string) {
  const base =
    clientName
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

function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("La URL debe empezar con http:// o https://");
  }
  return trimmed;
}

type RestaurantInfo = {
  name: string;
  legalName?: string;
  email?: string;
  ruc?: string;
  phone?: string;
  address?: string;
  product?: string;
};

async function fetchRestaurantInfo(baseUrl: string): Promise<RestaurantInfo> {
  const paths = [
    "/api/fadey/restaurant",
    "/fadey/restaurant",
    "/api/restaurant",
    "/api/local",
  ];

  let lastError = "No se pudo consultar el web service";

  for (const apiPath of paths) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${baseUrl}${apiPath}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        lastError = `El web service respondió ${res.status} en ${apiPath}`;
        continue;
      }
      const data = (await res.json()) as Record<string, unknown>;
      const name = String(
        data.name ||
          data.restaurantName ||
          data.localName ||
          data.nombre ||
          data.businessName ||
          "",
      ).trim();
      if (!name) {
        lastError = `La respuesta de ${apiPath} no trae nombre del restaurante`;
        continue;
      }
      return {
        name,
        legalName: data.legalName ? String(data.legalName) : undefined,
        email: data.email ? String(data.email) : undefined,
        ruc: data.ruc ? String(data.ruc) : undefined,
        phone:
          data.phone || data.telefono
            ? String(data.phone || data.telefono)
            : undefined,
        address:
          data.address || data.direccion
            ? String(data.address || data.direccion)
            : undefined,
        product: data.product ? String(data.product) : undefined,
      };
    } catch (err) {
      clearTimeout(timer);
      lastError =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Tiempo de espera agotado al contactar el web service"
            : err.message
          : lastError;
    }
  }

  throw new Error(lastError);
}

function mapUser<T extends { products: unknown }>(user: T) {
  return { ...user, products: asProducts(user.products) };
}

export const usersRouter = Router();

usersRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.clientUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        clientName: true,
        products: true,
        active: true,
        createdAt: true,
        webServiceUrl: true,
        licenseKey: true,
        restaurantData: true,
        _count: { select: { payments: true } },
      },
    });
    res.json(users.map(mapUser));
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.post("/probe-webservice", requireAdmin, async (req, res) => {
  try {
    const baseUrl = normalizeBaseUrl(String(req.body?.url || ""));
    const restaurant = await fetchRestaurantInfo(baseUrl);
    res.json({ url: baseUrl, restaurant });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "No se pudo leer el web service",
    });
  }
});

usersRouter.post("/link-webservice", requireAdmin, async (req, res) => {
  try {
    const baseUrl = normalizeBaseUrl(String(req.body?.url || ""));
    const productsRaw = Array.isArray(req.body?.products)
      ? req.body.products
      : ["resto"];
    const products = productsRaw.filter((p: string) =>
      PRODUCTS.has(p),
    ) as Product[];
    if (products.length === 0) {
      res.status(400).json({ error: "Selecciona al menos un producto" });
      return;
    }

    const existingUrl = await prisma.clientUser.findFirst({
      where: { webServiceUrl: baseUrl },
    });
    if (existingUrl) {
      res.status(409).json({
        error: "Este web service ya está vinculado",
        userId: existingUrl.id,
        licenseKey: existingUrl.licenseKey,
        username: existingUrl.username,
      });
      return;
    }

    const restaurant = await fetchRestaurantInfo(baseUrl);
    let username = genUsername(restaurant.name);
    const password = genPassword();
    while (await prisma.clientUser.findUnique({ where: { username } })) {
      username = genUsername(restaurant.name);
    }

    const clientId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.clientUser.create({
      data: {
        id: clientId,
        licenseKey: clientId,
        username,
        passwordHash,
        clientName: restaurant.name,
        products,
        webServiceUrl: baseUrl,
        restaurantData: restaurant,
      },
    });

    res.status(201).json({
      id: user.id,
      licenseKey: user.licenseKey,
      clientId: user.id,
      username: user.username,
      password,
      clientName: user.clientName,
      products: asProducts(user.products),
      webServiceUrl: user.webServiceUrl,
      restaurant,
      note: "Guarda usuario, contraseña e ID de cliente/licencia. El ID controla y aprueba pagos.",
    });
  } catch (err) {
    if (err instanceof Error && !err.message.includes("DATABASE")) {
      res.status(400).json({ error: err.message });
      return;
    }
    sendApiError(res, err);
  }
});

usersRouter.post("/link", requireAdmin, async (req, res) => {
  try {
    const clientName = String(req.body?.clientName || "").trim();
    const leadId = req.body?.leadId ? String(req.body.leadId) : null;
    const productsRaw = Array.isArray(req.body?.products)
      ? req.body.products
      : [];
    const products = productsRaw.filter((p: string) =>
      PRODUCTS.has(p),
    ) as Product[];

    if (!clientName || products.length === 0) {
      res.status(400).json({
        error: "Nombre y al menos un producto requeridos",
      });
      return;
    }

    let username =
      String(req.body?.username || "").trim() || genUsername(clientName);
    const password = String(req.body?.password || "").trim() || genPassword();

    while (await prisma.clientUser.findUnique({ where: { username } })) {
      username = genUsername(clientName);
    }

    const clientId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.clientUser.create({
      data: {
        id: clientId,
        licenseKey: clientId,
        username,
        passwordHash,
        clientName,
        products,
        webServiceUrl: req.body?.webServiceUrl
          ? String(req.body.webServiceUrl).trim()
          : null,
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
      licenseKey: user.licenseKey,
      clientId: user.id,
      username: user.username,
      password,
      clientName: user.clientName,
      products: asProducts(user.products),
      note: "Guarda la contraseña y el ID de cliente/licencia ahora.",
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.post("/:id/reset-password", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const password = genPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.clientUser.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, username: true, clientName: true, licenseKey: true },
    });
    res.json({ ...user, password, clientId: user.id });
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const data: Prisma.ClientUserUpdateInput = {};

    if (req.body?.clientName) {
      data.clientName = String(req.body.clientName).trim();
    }
    if (Array.isArray(req.body?.products)) {
      data.products = req.body.products.filter((p: string) =>
        PRODUCTS.has(p),
      ) as Product[];
    }
    if (typeof req.body?.active === "boolean") data.active = req.body.active;
    if (req.body?.password) {
      data.passwordHash = await bcrypt.hash(String(req.body.password), 10);
    }
    if (req.body?.webServiceUrl !== undefined) {
      data.webServiceUrl = req.body.webServiceUrl
        ? String(req.body.webServiceUrl).trim()
        : null;
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
        webServiceUrl: true,
        licenseKey: true,
      },
    });
    res.json({ ...mapUser(user), clientId: user.id });
  } catch (err) {
    sendApiError(res, err);
  }
});
