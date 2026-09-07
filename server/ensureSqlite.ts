import { execSync } from "node:child_process";
import { prisma, dbPath, fileUrl } from "./db.js";

async function schemaReady() {
  await prisma.lead.findFirst({ take: 1 });
  await prisma.reclamacion.findFirst({ take: 1 });
}

/** Si faltan tablas del schema, aplica prisma db push en SQLite. */
export async function ensureSqliteSchema() {
  try {
    await schemaReady();
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
    await schemaReady();
    console.log("[fadey-api] Schema SQLite listo.");
    return { ok: true, pushed: true };
  }
}
