import { prisma } from "../db.js";

export function normalizeCredential(raw: string) {
  return String(raw || "").trim().toUpperCase();
}

function firstNameToken(raw: string) {
  const token =
    raw
      .trim()
      .split(/\s+/)[0]
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase() || "";
  return token || "ADMIN";
}

/** Primer nombre del dueño/admin + 3 dígitos aleatorios (usuario y contraseña). */
export function genOwnerCredential(ownerName: string) {
  const first = firstNameToken(ownerName);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${first}${suffix}`;
}

export async function genUniqueOwnerCredential(ownerName: string) {
  let credential = genOwnerCredential(ownerName);
  while (await prisma.clientUser.findUnique({ where: { username: credential } })) {
    credential = genOwnerCredential(ownerName);
  }
  return credential;
}

export async function genOwnerAccess(ownerName: string) {
  const username = await genUniqueOwnerCredential(ownerName);
  let password = genOwnerCredential(ownerName);
  while (password === username) {
    password = genOwnerCredential(ownerName);
  }
  return { username, password };
}

export type PortalAccessRecord = {
  username: string;
  password: string;
  createdAt: string;
};

export function withPortalAccess(
  restaurant: Record<string, unknown> | null | undefined,
  username: string,
  password: string,
): Record<string, unknown> {
  const base =
    restaurant && typeof restaurant === "object" && !Array.isArray(restaurant)
      ? { ...restaurant }
      : {};
  const access: PortalAccessRecord = {
    username: normalizeCredential(username),
    password: normalizeCredential(password),
    createdAt: new Date().toISOString(),
  };
  return { ...base, fadeyPortalAccess: access };
}

export function readPortalAccess(
  restaurantData: unknown,
  fallbackUsername: string,
): PortalAccessRecord | null {
  if (!restaurantData || typeof restaurantData !== "object") return null;
  const access = (restaurantData as { fadeyPortalAccess?: PortalAccessRecord })
    .fadeyPortalAccess;
  if (!access?.username || !access?.password) return null;
  return {
    username: normalizeCredential(access.username),
    password: normalizeCredential(access.password),
    createdAt: access.createdAt || "",
  };
}
