import { prisma } from "../db.js";

/** Normaliza URL del web service para comparar y guardar de forma consistente. */
export function normalizeWebServiceUrl(
  raw: string | null | undefined,
): string | null {
  let trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  trimmed = trimmed.replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export async function findWebServiceUrlOwner(
  url: string,
  excludeUserId?: string,
) {
  const normalized = normalizeWebServiceUrl(url);
  if (!normalized) return null;
  return prisma.clientUser.findFirst({
    where: {
      webServiceUrl: normalized,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true, clientName: true, username: true },
  });
}

export async function assertWebServiceUrlExclusive(
  userId: string,
  url: string | null | undefined,
) {
  const normalized = normalizeWebServiceUrl(url);
  if (!normalized) return { ok: true as const, normalized: null };
  const owner = await findWebServiceUrlOwner(normalized, userId);
  if (owner) {
    return {
      ok: false as const,
      normalized,
      error: `Este web service ya pertenece a ${owner.clientName} (${owner.username})`,
      owner,
    };
  }
  return { ok: true as const, normalized };
}
