import { and, eq, isNull, sql } from "drizzle-orm";

import {
  categories,
  mediaAssets,
  productCategories,
  products,
  stockMovements,
} from "@/db/schema";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";

import type { ImportDatabase } from "./db";
import { stockCorrelationId } from "./sku-and-price";
import type {
  CategoryPlan,
  NormalizedProductRow,
  ProductConflictCheck,
  ProductStatus,
} from "./types";

export type ExistingCategory = {
  id: string;
  titleHy: string | null;
  slugHy: string | null;
  titleEn: string | null;
  slugEn: string | null;
};

export type ExistingProduct = {
  id: string;
  sku: string;
  stockOnHand: number;
  status: ProductStatus;
  priceAmount: number;
  slugHy: string | null;
};

function normalizeCategoryTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Loads all non-deleted categories for idempotent matching. */
export async function loadExistingCategories(
  db: ImportDatabase,
): Promise<ExistingCategory[]> {
  const rows = await db
    .select({
      id: categories.id,
      translations: categories.translations,
    })
    .from(categories)
    .where(isNull(categories.deletedAt));

  return rows.map((row) => ({
    id: row.id,
    titleHy: row.translations.hy?.title ?? null,
    slugHy: row.translations.hy?.slug ?? null,
    titleEn: row.translations.en?.title ?? null,
    slugEn: row.translations.en?.slug ?? null,
  }));
}

export function findExistingCategory(
  existing: ExistingCategory[],
  title: string,
): ExistingCategory | null {
  const needle = normalizeCategoryTitle(title);
  const slug = slugifyCategoryTitle(title);

  return (
    existing.find(
      (row) =>
        (row.titleHy && normalizeCategoryTitle(row.titleHy) === needle) ||
        (row.titleEn && normalizeCategoryTitle(row.titleEn) === needle) ||
        row.slugHy === slug ||
        row.slugEn === slug,
    ) ?? null
  );
}

export function buildCategoryPlans(
  titles: string[],
  existing: ExistingCategory[],
): CategoryPlan[] {
  const unique = [...new Set(titles.map((t) => t.trim()).filter(Boolean))];
  return unique.map((title) => {
    const found = findExistingCategory(existing, title);
    return {
      title,
      slug: slugifyCategoryTitle(title),
      existingId: found?.id ?? null,
      plannedMutation: found ? "reused" : "created",
    };
  });
}

/** Loads products by import SKUs (small batch; loop is intentional). */
export async function loadExistingProductsBySkus(
  db: ImportDatabase,
  skus: string[],
): Promise<Map<string, ExistingProduct>> {
  const map = new Map<string, ExistingProduct>();
  for (const sku of skus) {
    const [row] = await db
      .select({
        id: products.id,
        sku: products.sku,
        stockOnHand: products.stockOnHand,
        status: products.status,
        priceAmount: products.priceAmount,
        translations: products.translations,
      })
      .from(products)
      .where(and(eq(products.sku, sku), isNull(products.deletedAt)))
      .limit(1);
    if (row) {
      map.set(row.sku, {
        id: row.id,
        sku: row.sku,
        stockOnHand: row.stockOnHand,
        status: row.status,
        priceAmount: row.priceAmount,
        slugHy: row.translations.hy?.slug ?? null,
      });
    }
  }
  return map;
}

export async function findProductBySlug(
  db: ImportDatabase,
  slug: string,
): Promise<ExistingProduct | null> {
  const [row] = await db
    .select({
      id: products.id,
      sku: products.sku,
      stockOnHand: products.stockOnHand,
      status: products.status,
      priceAmount: products.priceAmount,
      translations: products.translations,
    })
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        sql`(
          (${products.translations}->'hy'->>'slug') = ${slug}
          OR (${products.translations}->'en'->>'slug') = ${slug}
          OR (${products.translations}->'ru'->>'slug') = ${slug}
        )`,
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    stockOnHand: row.stockOnHand,
    status: row.status,
    priceAmount: row.priceAmount,
    slugHy: row.translations.hy?.slug ?? null,
  };
}

/** Loads every populated translation slug for collision reservation. */
export async function loadAllExistingProductSlugs(
  db: ImportDatabase,
): Promise<Array<{ slug: string; sku: string }>> {
  const rows = await db
    .select({
      sku: products.sku,
      translations: products.translations,
    })
    .from(products)
    .where(isNull(products.deletedAt));

  const result: Array<{ slug: string; sku: string }> = [];
  for (const row of rows) {
    for (const locale of ["hy", "en", "ru"] as const) {
      const slug = row.translations[locale]?.slug?.trim();
      if (slug) {
        result.push({ slug, sku: row.sku });
      }
    }
  }
  return result;
}

export async function hasImportStockMovement(
  db: ImportDatabase,
  productId: string,
  sku: string,
): Promise<boolean> {
  const correlation = stockCorrelationId(sku);
  const [row] = await db
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.productId, productId),
        eq(stockMovements.reason, "IMPORT"),
        eq(stockMovements.correlationId, correlation),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function loadProductMediaKeys(
  db: ImportDatabase,
  productId: string,
): Promise<string[]> {
  const rows = await db
    .select({ objectKey: mediaAssets.objectKey })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, productId));
  return rows.map((row) => row.objectKey);
}

export async function loadProductCategoryIds(
  db: ImportDatabase,
  productId: string,
): Promise<string[]> {
  const rows = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));
  return rows.map((row) => row.categoryId);
}

export async function buildProductConflictCheck(
  db: ImportDatabase,
  product: NormalizedProductRow,
  bySku: Map<string, ExistingProduct>,
): Promise<ProductConflictCheck> {
  const existing = bySku.get(product.sku) ?? null;
  const slugOwner = await findProductBySlug(db, product.slug);
  const slugOwnedByOtherSku = Boolean(
    slugOwner && slugOwner.sku !== product.sku,
  );

  let existingCategoryIds: string[] = [];
  let existingMediaObjectKeys: string[] = [];
  let hasMovement = false;

  if (existing) {
    existingCategoryIds = await loadProductCategoryIds(db, existing.id);
    existingMediaObjectKeys = await loadProductMediaKeys(db, existing.id);
    hasMovement = await hasImportStockMovement(db, existing.id, product.sku);
  }

  return {
    existingProductId: existing?.id ?? null,
    existingSkuOwnerId: existing?.id ?? null,
    slugOwnedByOtherSku,
    slugOwnerSku: slugOwner?.sku ?? null,
    existingStockOnHand: existing?.stockOnHand ?? null,
    existingStatus: existing?.status ?? null,
    existingPriceAmount: existing?.priceAmount ?? null,
    hasImportStockMovement: hasMovement,
    existingCategoryIds,
    existingMediaObjectKeys,
  };
}
