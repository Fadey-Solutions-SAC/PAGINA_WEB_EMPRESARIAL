import type { Product } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const PRODUCTS = new Set(["resto", "erp", "web", "soporte"]);

/** Lee products desde Json de SQLite. */
export function asProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is Product => typeof p === "string" && PRODUCTS.has(p));
}

/** Serializa products para guardar en Json. */
export function toProductsJson(products: Product[]): Prisma.InputJsonValue {
  return products;
}
