import { Router } from "express";
import type { Product } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);

export const leadsRouter = Router();

leadsRouter.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const company = String(req.body?.company || "").trim() || null;
    const phone = String(req.body?.phone || "").trim() || null;
    const intent = String(req.body?.intent || "").trim() as Product;
    const message = String(req.body?.message || "").trim() || null;

    if (!name || !email || !PRODUCTS.has(intent)) {
      res.status(400).json({ error: "Datos de registro incompletos" });
      return;
    }

    const lead = await prisma.lead.create({
      data: { name, email, company, phone, intent, message },
    });
    res.status(201).json(lead);
  } catch (err) {
    sendApiError(res, err);
  }
});

leadsRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: { linkedUser: { select: { id: true, username: true } } },
    });
    res.json(leads);
  } catch (err) {
    sendApiError(res, err);
  }
});
