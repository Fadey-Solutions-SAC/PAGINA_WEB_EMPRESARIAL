import type { Response } from "express";

export function isDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  return (
    msg.includes("DATABASE_URL") ||
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1017") ||
    msg.includes("P2021") ||
    code === "P2021" ||
    msg.includes("PrismaClientInitialization") ||
    msg.includes("Environment variable not found") ||
    msg.includes("does not exist")
  );
}

export function sendApiError(res: Response, err: unknown, fallback = "Error interno") {
  console.error(err);
  if (isDbError(err)) {
    res.status(503).json({
      error:
        "Base de datos no lista. En Render: KEY debe ser DB_PATH (no BD_PATH), DATABASE_URL=file:/data/fadey.db, Disk en /data, Start Command: npm run start:prod",
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
