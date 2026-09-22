import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { Prisma, Product } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin, signToken } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";
import { asProducts } from "../utils/products.js";
import {
  genOwnerAccess,
  genOwnerCredential,
  genUniqueOwnerCredential,
  normalizeCredential,
  readPortalAccess,
  withPortalAccess,
} from "../utils/credentials.js";
import {
  notifyPosPolicyStatus,
  posPolicyNotifyUserMessage,
} from "../utils/posNotify.js";
import {
  assertWebServiceUrlExclusive,
  normalizeWebServiceUrl,
} from "../utils/webServiceUrl.js";
import { youtubeEmbed } from "../utils/youtube.js";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);

function resolveOwnerName(restaurant: RestaurantInfo) {
  if (restaurant.ownerName) return restaurant.ownerName;
  if (restaurant.legalName) return restaurant.legalName;
  return restaurant.name;
}

const CENTRAL_HOSTS = new Set([
  "fadeysolutions.pe",
  "www.fadeysolutions.pe",
  "fadey-solutions-pe.onrender.com",
]);

function normalizeBaseUrl(raw: string) {
  const normalized = normalizeWebServiceUrl(raw);
  if (!normalized) {
    throw new Error("La URL debe empezar con http:// o https://");
  }
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("URL del web service inválida");
  }
  const host = parsed.hostname.toLowerCase();
  if (CENTRAL_HOSTS.has(host)) {
    throw new Error(
      "Esa es la API o la web de Fadey, no el POS. Pega la URL de Render del cliente (ej. https://tu-local.onrender.com).",
    );
  }
  const frontendPath = /^\/(admin|login|app|dashboard|panel|#)/i.test(
    parsed.pathname,
  );
  if (frontendPath || parsed.pathname === "/") {
    return `${parsed.protocol}//${parsed.host}`;
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`;
}

function posServiceSecret() {
  return String(
    process.env.API_INGEST_SECRET || process.env.API_SECRET_KEY || "",
  ).trim();
}

async function readPosJson(res: Response, apiPath: string) {
  const ct = String(res.headers.get("content-type") || "");
  const text = await res.text();
  const body = text.trim();
  if (!body) {
    throw new Error(`Respuesta vacía en ${apiPath}`);
  }
  if (body.startsWith("<") || ct.includes("text/html")) {
    throw new Error(
      "Esa URL devolvió una página web, no la API del POS. Usa el servicio de Render (…onrender.com), no Vercel ni fadeysolutions.pe.",
    );
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error(`La respuesta de ${apiPath} no es JSON válido`);
  }
}

type RestaurantInfo = {
  name: string;
  ownerName?: string;
  legalName?: string;
  email?: string;
  ruc?: string;
  phone?: string;
  address?: string;
  product?: string;
};

function restaurantFromPayload(data: Record<string, unknown>, apiPath: string) {
  const inner =
    data.restaurant && typeof data.restaurant === "object"
      ? (data.restaurant as Record<string, unknown>)
      : data;
  const name = String(
    inner.name ||
      inner.restaurantName ||
      inner.localName ||
      inner.nombre ||
      inner.businessName ||
      data.name ||
      "",
  ).trim();
  if (!name) {
    throw new Error(`La respuesta de ${apiPath} no trae nombre del restaurante`);
  }
  const ownerRaw = String(
    inner.ownerName ||
      inner.owner ||
      inner.adminName ||
      inner.admin ||
      inner.dueno ||
      inner.nombreDueno ||
      inner.legalName ||
      "",
  ).trim();
  return {
    name,
    ownerName: ownerRaw ? ownerRaw.split(/\s+/)[0] : undefined,
    legalName: inner.legalName ? String(inner.legalName) : undefined,
    email: inner.email ? String(inner.email) : undefined,
    ruc: inner.ruc ? String(inner.ruc) : undefined,
    phone:
      inner.phone || inner.telefono
        ? String(inner.phone || inner.telefono)
        : undefined,
    address:
      inner.address || inner.direccion
        ? String(inner.address || inner.direccion)
        : undefined,
    product: inner.product ? String(inner.product) : undefined,
  } satisfies RestaurantInfo;
}

function addServiceBase(list: string[], raw: string | null | undefined) {
  const n = normalizeWebServiceUrl(raw);
  if (!n) return;
  try {
    const host = new URL(n).hostname.toLowerCase();
    if (CENTRAL_HOSTS.has(host)) return;
  } catch {
    return;
  }
  if (!list.includes(n)) list.push(n);
}

async function resolveWebServiceBases(raw: string): Promise<string[]> {
  const origin = normalizeBaseUrl(raw);
  const host = new URL(origin).hostname.toLowerCase();
  const bases: string[] = [];

  if (host.endsWith(".vercel.app")) {
    const slug = host
      .replace(/\.vercel\.app$/i, "")
      .replace(/-git-.*$/i, "");
    addServiceBase(bases, `https://${slug}.onrender.com`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${origin}/fadey-link.json`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const link = await readPosJson(res, "/fadey-link.json");
        if (link.apiUrl) addServiceBase(bases, String(link.apiUrl));
      }
    } catch {
      /* el front de Vercel no siempre publica fadey-link.json */
    }
  }

  addServiceBase(bases, origin);
  return bases;
}

async function fetchRestaurantInfoFromBase(baseUrl: string): Promise<RestaurantInfo> {
  const secret = posServiceSecret();
  const attempts: { path: string; auth?: boolean }[] = [
    { path: "/api/fadey/restaurant" },
    { path: "/fadey/restaurant" },
    { path: "/api/local" },
    { path: "/api/restaurant/info", auth: true },
    { path: "/api/restaurant" },
  ];

  let lastError = "No se pudo consultar el web service";

  for (const attempt of attempts) {
    if (attempt.auth && !secret) continue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch(`${baseUrl}${attempt.path}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(attempt.auth ? { Authorization: `Bearer ${secret}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        lastError = `El web service respondió ${res.status} en ${attempt.path}`;
        continue;
      }
      const data = await readPosJson(res, attempt.path);
      return restaurantFromPayload(data, attempt.path);
    } catch (err) {
      clearTimeout(timer);
      lastError =
        err instanceof Error
          ? err.name === "AbortError"
            ? "El POS tardó demasiado en responder. Si está en Render, espera a que despierte e inténtalo de nuevo."
            : err.message
          : lastError;
    }
  }

  throw new Error(lastError);
}

async function fetchRestaurantInfo(rawUrl: string): Promise<{
  url: string;
  restaurant: RestaurantInfo;
}> {
  const bases = await resolveWebServiceBases(rawUrl);
  let lastError = "No se pudo consultar el web service";
  for (const base of bases) {
    try {
      const restaurant = await fetchRestaurantInfoFromBase(base);
      return { url: base, restaurant };
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
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
    const { url, restaurant } = await fetchRestaurantInfo(
      String(req.body?.url || ""),
    );
    res.json({ url, restaurant });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "No se pudo leer el web service",
    });
  }
});

usersRouter.post("/link-webservice", requireAdmin, async (req, res) => {
  try {
    const { url: baseUrl, restaurant } = await fetchRestaurantInfo(
      String(req.body?.url || ""),
    );
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

    const { username, password } = await genOwnerAccess(
      resolveOwnerName(restaurant),
    );

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
        restaurantData: withPortalAccess(restaurant, username, password),
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
      posEnv: {
        CLIENT_ID: user.licenseKey,
        LICENSE_KEY: user.licenseKey,
        API_SECRET_KEY: "igual que API_INGEST_SECRET en la API Fadey (Render)",
        CENTRAL_API_URL: "URL de la API Fadey en Render (no el sitio fadeysolutions.pe)",
        RENDER_PUBLIC_URL: user.webServiceUrl || baseUrl,
      },
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

    const ownerName = clientName;
    let username = normalizeCredential(String(req.body?.username || ""));
    if (!username) {
      username = await genUniqueOwnerCredential(ownerName);
    }
    let password = normalizeCredential(String(req.body?.password || ""));
    if (!password) {
      password = genOwnerCredential(ownerName);
    }

    if (!req.body?.username) {
      while (await prisma.clientUser.findUnique({ where: { username } })) {
        username = await genUniqueOwnerCredential(ownerName);
      }
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
          ? normalizeWebServiceUrl(String(req.body.webServiceUrl))
          : null,
        restaurantData: withPortalAccess(null, username, password),
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

usersRouter.post("/:id/enter-as-client", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.clientUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        clientName: true,
        products: true,
        active: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const products = asProducts(user.products);
    const token = signToken({
      role: "client",
      userId: user.id,
      products,
      impersonated: true,
    });

    res.json({
      token,
      role: "client",
      userId: user.id,
      username: user.username,
      clientName: user.clientName,
      products,
      active: user.active,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.get("/:id/portal-preview", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.clientUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        clientName: true,
        products: true,
        active: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const products = asProducts(user.products);
    const [courses, progress] = await Promise.all([
      prisma.courseModule.findMany({
        where: { product: { in: products } },
        orderBy: [{ product: "asc" }, { kind: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.progress.findMany({
        where: { userId: id },
        select: { moduleId: true, completed: true },
      }),
    ]);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        clientName: user.clientName,
        products,
        active: user.active,
      },
      courses: courses.map((c) => ({
        ...c,
        embedUrl: youtubeEmbed(c.youtubeUrl),
      })),
      progress,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.get("/:id/access", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.clientUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        clientName: true,
        licenseKey: true,
        webServiceUrl: true,
        restaurantData: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const access = readPortalAccess(user.restaurantData, user.username);
    res.json({
      id: user.id,
      clientId: user.id,
      licenseKey: user.licenseKey,
      clientName: user.clientName,
      webServiceUrl: user.webServiceUrl,
      username: normalizeCredential(access?.username || user.username),
      password: access?.password || null,
      hasStoredPassword: Boolean(access?.password),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

usersRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.clientUser.findUnique({
      where: { id },
      select: {
        active: true,
        webServiceUrl: true,
        licenseKey: true,
        restaurantData: true,
      },
    });
    if (!existing) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

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
      res.status(400).json({
        error:
          "La contraseña no se puede cambiar. Es fija entre central y POS; usa Ver acceso para copiarla.",
      });
      return;
    }
    if (req.body?.webServiceUrl !== undefined) {
      const nextUrl = req.body.webServiceUrl
        ? normalizeWebServiceUrl(String(req.body.webServiceUrl))
        : null;
      if (nextUrl) {
        const exclusive = await assertWebServiceUrlExclusive(id, nextUrl);
        if (!exclusive.ok) {
          res.status(409).json({ error: exclusive.error });
          return;
        }
      }
      data.webServiceUrl = nextUrl;
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
        restaurantData: true,
      },
    });

    let posNotify = null;
    if (
      typeof req.body?.active === "boolean" &&
      req.body.active !== existing.active
    ) {
      posNotify = await notifyPosPolicyStatus(user, req.body.active);
    }

    res.json({
      ...mapUser(user),
      clientId: user.id,
      posNotify,
      posNotifyMessage: posNotify
        ? posPolicyNotifyUserMessage(posNotify, user.active)
        : undefined,
    });
  } catch (err) {
    sendApiError(res, err);
  }
});
