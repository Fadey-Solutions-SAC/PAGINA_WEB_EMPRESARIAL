import type { FinanceCategory } from "@prisma/client";
import { prisma } from "../db.js";

const INCOME_CATEGORIES = new Set<FinanceCategory>(["pago"]);
const EXPENSE_CATEGORIES: FinanceCategory[] = [
  "personal",
  "servidores",
  "publicidad",
  "equipos",
  "impuestos",
];

export const FINANCE_LABELS: Record<FinanceCategory, string> = {
  pago: "Pago",
  personal: "Personal",
  servidores: "Servidores",
  publicidad: "Publicidad",
  equipos: "Equipos",
  impuestos: "Impuestos",
};

export function isIncomeCategory(category: FinanceCategory) {
  return INCOME_CATEGORIES.has(category);
}

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function sumByCategory(
  entries: { category: FinanceCategory; amount: number }[],
  category: FinanceCategory,
) {
  return roundMoney(
    entries
      .filter((e) => e.category === category)
      .reduce((acc, e) => acc + e.amount, 0),
  );
}

export async function recordApprovedPaymentIncome(payment: {
  id: string;
  clientName: string;
  amount: number | null;
}) {
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const existing = await prisma.financeEntry.findUnique({
    where: { paymentId: payment.id },
  });
  if (existing) return existing;

  return prisma.financeEntry.create({
    data: {
      category: "pago",
      amount: roundMoney(amount),
      label: payment.clientName,
      paymentId: payment.id,
    },
  });
}

export async function removePaymentIncome(paymentId: string) {
  await prisma.financeEntry.deleteMany({ where: { paymentId } });
}

export async function createFinanceEntry(input: {
  category: FinanceCategory;
  amount: number;
  label?: string;
}) {
  const amount = roundMoney(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }
  if (input.category === "pago") {
    throw new Error("Los pagos de clientes se registran al aprobar en Pagos");
  }

  return prisma.financeEntry.create({
    data: {
      category: input.category,
      amount,
      label: String(input.label || FINANCE_LABELS[input.category]).trim(),
    },
  });
}

export async function syncApprovedPaymentsToLedger() {
  const approved = await prisma.payment.findMany({
    where: { status: "approved", amount: { gt: 0 } },
    select: { id: true, clientName: true, amount: true },
  });
  for (const payment of approved) {
    await recordApprovedPaymentIncome(payment);
  }
}

export async function getFinanceDashboard(month?: string) {
  await syncApprovedPaymentsToLedger();
  const now = new Date();
  let start = monthStart(now);
  let end = monthEnd(now);

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 0, 23, 59, 59, 999);
  }

  const entries = await prisma.financeEntry.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
  });

  const mes = sumByCategory(entries, "pago");
  const personal = sumByCategory(entries, "personal");
  const servidores = sumByCategory(entries, "servidores");
  const publicidad = sumByCategory(entries, "publicidad");
  const equipos = sumByCategory(entries, "equipos");
  const impuestos = sumByCategory(entries, "impuestos");
  const gastos = roundMoney(
    personal + servidores + publicidad + equipos + impuestos,
  );
  const ganancias = roundMoney(mes - gastos);

  const chartStart = new Date(start);
  chartStart.setDate(chartStart.getDate() - Math.max(0, 29 - (end.getDate() - 1)));

  const chartEntries = await prisma.financeEntry.findMany({
    where: {
      createdAt: {
        gte: new Date(end.getFullYear(), end.getMonth(), 1),
        lte: end,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const entry of chartEntries) {
    const key = entry.createdAt.toISOString().slice(0, 10);
    const sign = isIncomeCategory(entry.category) ? 1 : -1;
    byDay.set(key, roundMoney((byDay.get(key) || 0) + sign * entry.amount));
  }

  const daysInMonth = end.getDate();
  let running = 0;
  const chart: { date: string; ganancias: number; delta: number }[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const delta = byDay.get(key) || 0;
    running = roundMoney(running + delta);
    chart.push({ date: key, ganancias: running, delta });
  }

  return {
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    mes,
    personal,
    servidores,
    publicidad,
    equipos,
    impuestos,
    gastos,
    ganancias,
    chart,
    entries: entries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      label: entry.label,
      amount: entry.amount,
      direction: isIncomeCategory(entry.category) ? "in" : "out",
      typeLabel: FINANCE_LABELS[entry.category],
      createdAt: entry.createdAt.toISOString(),
      paymentId: entry.paymentId,
    })),
  };
}
