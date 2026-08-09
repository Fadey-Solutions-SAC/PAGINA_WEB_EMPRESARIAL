import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const prisma = new PrismaClient();

export const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"),
);
fs.mkdirSync(uploadsDir, { recursive: true });
