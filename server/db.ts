import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Disco persistente (como Resto FADEY): DB_PATH + UPLOADS_DIR. */
const dataDir = path.resolve(
  process.env.DATA_DIR || path.join(__dirname, "..", "data"),
);
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.resolve(
  process.env.DB_PATH ||
    process.env.BD_PATH || // alias por si se escribe mal en Render
    path.join(dataDir, "fadey.db"),
);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Siempre SQLite en disco. Ignora DATABASE_URL de Postgres si quedó en Render.
const fileUrl = `file:${dbPath.replace(/\\/g, "/")}`;
process.env.DATABASE_URL = fileUrl;

export const prisma = new PrismaClient({
  datasources: { db: { url: fileUrl } },
});

export const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(dataDir, "uploads"),
);
fs.mkdirSync(uploadsDir, { recursive: true });

export { dbPath, fileUrl };
