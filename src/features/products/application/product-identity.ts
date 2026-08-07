import "server-only";

import { and, eq, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { isUniqueViolation } from "@/features/payments/domain/postgres-errors";
import { locales } from "@/lib/i18n/config";
import { err, type Result } from "@/lib/result";

const PRODUCTS_SKU_UIDX = "products_sku_uidx";

export const SKU_EXISTS_MESSAGE = "A product with this SKU already exists.";
export const SLUG_EXISTS_MESSAGE = "A product with this slug already exists.";

/**
 * SKU uniqueness matches DB index `products_sku_uidx` (includes soft-deleted rows).
 */
async function findSkuConflict(
  sku: string,
  excludeProductId?: string,
): Promise<boolean> {
  const conditions = [eq(products.sku, sku)];
  if (excludeProductId) {
    conditions.push(ne(products.id, excludeProductId));
  }
  const [row] = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(and(...conditions))
    .limit(1);
  return Boolean(row);
}

/**
 * Shared slug uniqueness across hy/en/ru, matching per-locale unique indexes
 * (includes soft-deleted rows).
 */
async function findSlugConflict(
  slug: string,
  excludeProductId?: string,
): Promise<boolean> {
  const slugMatch = or(
    sql`${products.translations}->'hy'->>'slug' = ${slug}`,
    sql`${products.translations}->'en'->>'slug' = ${slug}`,
    sql`${products.translations}->'ru'->>'slug' = ${slug}`,
  )!;
  const where = excludeProductId
    ? and(slugMatch, ne(products.id, excludeProductId))
    : slugMatch;
  const [row] = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(where)
    .limit(1);
  return Boolean(row);
}

/** Pre-insert/update check for SKU and shared slug collisions. */
export async function assertProductIdentityAvailable(
  sku: string,
  slug: string,
  excludeProductId?: string,
): Promise<Result<never> | null> {
  if (await findSkuConflict(sku, excludeProductId)) {
    return err("SKU_EXISTS", SKU_EXISTS_MESSAGE);
  }
  if (await findSlugConflict(slug, excludeProductId)) {
    return err("SLUG_EXISTS", SLUG_EXISTS_MESSAGE);
  }
  return null;
}

/** Maps Postgres unique violations on product identity indexes to Result errors. */
export function mapProductUniqueViolation(
  error: unknown,
): Result<never> | null {
  if (isUniqueViolation(error, PRODUCTS_SKU_UIDX)) {
    return err("SKU_EXISTS", SKU_EXISTS_MESSAGE);
  }
  for (const loc of locales) {
    if (isUniqueViolation(error, `products_slug_${loc}_uidx`)) {
      return err("SLUG_EXISTS", SLUG_EXISTS_MESSAGE);
    }
  }
  if (isUniqueViolation(error)) {
    return err("VALIDATION_ERROR", "Product SKU or slug is already in use.");
  }
  return null;
}
