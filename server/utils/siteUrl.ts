import type { Request } from "express";

const DEFAULT_SITE = "https://fadeysolutions.pe";

export function publicSiteOrigin() {
  const fromEnv = String(process.env.PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return DEFAULT_SITE;
}

export function publicApiOrigin(req: Request) {
  const fromEnv = String(
    process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || "",
  )
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.get("host") || "")
    .split(",")[0]
    .trim();
  return host ? `${proto}://${host}` : "";
}

export function collaboratorPublicPath(code: string) {
  return `/colaboradores/${encodeURIComponent(code)}`;
}

export function collaboratorPublicUrl(code: string) {
  return `${publicSiteOrigin()}${collaboratorPublicPath(code)}`;
}

export function absoluteUploadUrl(req: Request, url: string) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const origin = publicApiOrigin(req);
  if (value.startsWith("/") && origin) return `${origin}${value}`;
  return value;
}
