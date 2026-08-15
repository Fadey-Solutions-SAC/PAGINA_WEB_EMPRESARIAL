import type { Response } from "express";

export function isDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("DATABASE_URL") ||
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1017") ||
    msg.includes("PrismaClientInitialization") ||
    msg.includes("Environment variable not found")
  );
}

export function sendApiError(res: Response, err: unknown, fallback = "Error interno") {
  console.error(err);
  if (isDbError(err)) {
    res.status(503).json({
      error:
        "No se pudo conectar a la base de datos. Revisa DATABASE_URL (local o en Render) y que Postgres esté activo.",
      code: "DB_UNAVAILABLE",
    });
    return;
  }
  const message = err instanceof Error ? err.message : fallback;
  // Never leak prisma schema paths
  if (message.includes("schema.prisma") || message.includes("Invalid `prisma")) {
    res.status(500).json({ error: "Error de base de datos", code: "DB_ERROR" });
    return;
  }
  res.status(500).json({ error: message });
}
