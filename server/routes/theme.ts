import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { uploadsDir } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const themeRouter = Router();

const THEMES = ["blue", "emerald"] as const;
type SiteTheme = (typeof THEMES)[number];
const themeFile = path.join(uploadsDir, "site-theme.json");

function isTheme(value: unknown): value is SiteTheme {
  return value === "blue" || value === "emerald";
}

function readTheme(): SiteTheme {
  try {
    const raw = fs.readFileSync(themeFile, "utf8");
    const parsed = JSON.parse(raw) as { theme?: unknown };
    if (isTheme(parsed.theme)) return parsed.theme;
  } catch {
    /* missing or invalid */
  }
  return "emerald";
}

function writeTheme(theme: SiteTheme) {
  fs.writeFileSync(themeFile, JSON.stringify({ theme }, null, 2), "utf8");
}

themeRouter.get("/", (_req, res) => {
  res.json({ theme: readTheme() });
});

themeRouter.put("/", requireAdmin, (req, res) => {
  const next = req.body?.theme;
  if (!isTheme(next)) {
    res.status(400).json({ error: "Tema inválido" });
    return;
  }
  writeTheme(next);
  res.json({ theme: next });
});
