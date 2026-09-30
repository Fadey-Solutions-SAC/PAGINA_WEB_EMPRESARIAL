import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { uploadsDir } from "../db.js";

export const RECEIPT_MAX_BYTES = 15 * 1024 * 1024;

export const RECEIPT_ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"]);

/** Extensión real según los primeros bytes (no confía en content-type ni en la URL). */
export function sniffReceiptExt(buf: Buffer): string | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return ".pdf";
  if (buf.length >= 8 && buf[0] === 0x89 && buf.subarray(1, 4).toString("latin1") === "PNG") return ".png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (
    buf.length >= 12
    && buf.subarray(0, 4).toString("latin1") === "RIFF"
    && buf.subarray(8, 12).toString("latin1") === "WEBP"
  ) return ".webp";
  if (buf.length >= 6 && buf.subarray(0, 4).toString("latin1") === "GIF8") return ".gif";
  return null;
}

/** Extensión para archivos subidos por formulario (multer). */
export function receiptExtFromUpload(originalname: string, mimetype: string): string {
  const fromMime = EXT_BY_MIME[String(mimetype || "").toLowerCase()];
  if (fromMime) return fromMime;
  const ext = path.extname(String(originalname || "")).toLowerCase();
  return ALLOWED_EXT.has(ext) ? (ext === ".jpeg" ? ".jpg" : ext) : ".png";
}

export function isAllowedReceiptUpload(originalname: string, mimetype: string): boolean {
  const mime = String(mimetype || "").toLowerCase();
  if (RECEIPT_ALLOWED_MIME.has(mime)) return true;
  const ext = path.extname(String(originalname || "")).toLowerCase();
  return (mime === "application/octet-stream" || !mime) && ALLOWED_EXT.has(ext);
}

/** Descarga el comprobante publicado por el POS (imagen o PDF) y lo guarda en /uploads. */
export async function downloadReceiptToUploads(voucherUrl: string): Promise<string> {
  const url = String(voucherUrl || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("voucherUrl debe ser una URL pública http(s)");
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "image/*,application/pdf,*/*" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el comprobante (${res.status})`);
  }

  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > RECEIPT_MAX_BYTES) {
    throw new Error("El comprobante supera 15 MB");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("El comprobante descargado está vacío");
  if (buf.length > RECEIPT_MAX_BYTES) throw new Error("El comprobante supera 15 MB");

  const ext = sniffReceiptExt(buf);
  if (!ext) {
    throw new Error("El comprobante debe ser una imagen (PNG, JPG, WEBP, GIF) o un PDF");
  }

  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buf);
  return `/uploads/${filename}`;
}
