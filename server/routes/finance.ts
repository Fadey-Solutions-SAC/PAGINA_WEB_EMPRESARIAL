import { Router } from "express";
import type { FinanceCategory } from "@prisma/client";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";
import {
  createFinanceEntry,
  getFinanceDashboard,
  FINANCE_LABELS,
} from "../utils/financeLedger.js";

const EXPENSE_CATEGORIES = new Set<FinanceCategory>([
  "personal",
  "servidores",
  "publicidad",
  "equipos",
  "impuestos",
]);

export const financeRouter = Router();

financeRouter.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const month = String(req.query.month || "").trim();
    const data = await getFinanceDashboard(month || undefined);
    res.json(data);
  } catch (err) {
    sendApiError(res, err);
  }
});

financeRouter.get("/categories", requireAdmin, (_req, res) => {
  res.json({
    expense: Array.from(EXPENSE_CATEGORIES).map((id) => ({
      id,
      label: FINANCE_LABELS[id],
    })),
    income: [{ id: "pago", label: FINANCE_LABELS.pago }],
  });
});

financeRouter.post("/entries", requireAdmin, async (req, res) => {
  try {
    const category = String(req.body?.category || "") as FinanceCategory;
    const amount = Number(req.body?.amount);
    const label = String(req.body?.label || "").trim();

    if (!EXPENSE_CATEGORIES.has(category)) {
      res.status(400).json({
        error:
          "category debe ser personal, servidores, publicidad, equipos o impuestos",
      });
      return;
    }

    const entry = await createFinanceEntry({ category, amount, label });
    const dashboard = await getFinanceDashboard();
    res.status(201).json({ entry, dashboard });
  } catch (err) {
    if (err instanceof Error && err.message.includes("monto")) {
      res.status(400).json({ error: err.message });
      return;
    }
    sendApiError(res, err);
  }
});
