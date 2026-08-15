import { execSync } from "node:child_process";
import { prisma, dbPath, fileUrl } from "./db.js";

/** Si la tabla Lead no existe, aplica el schema SQLite. */
export async function ensureSqliteSchema() {
  try {
    await prisma.lead.findFirst({ take: 1 });
    return { ok: true, pushed: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const missing =
      msg.includes("P2021") ||
      msg.includes("does not exist") ||
      msg.includes("no such table");
    if (!missing) throw err;

    console.warn(
      `[fadey-api] Schema ausente en ${dbPath}. Ejecutando prisma db push…`,
    );
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: fileUrl },
    });
    // Reintentar
    await prisma.lead.findFirst({ take: 1 });
    console.log("[fadey-api] Schema SQLite listo.");
    return { ok: true, pushed: true };
  }
}
