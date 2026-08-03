import "server-only";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
} from "@/db/schema";
import { resolveProductTranslation } from "@/features/products/domain/resolve-translation";
import {
  parseProductCustomization,
  productRequiresConfiguration,
} from "@/features/products/domain/customization";
import type { CatalogProduct } from "@/features/products/types";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

function toCatalogProduct(
  product: typeof products.$inferSelect,
  locale: Locale,
  imageUrl: string | null,
  categoryTitle: string | null,
): Omit<
  CatalogProduct,
  "priceAmount" | "compareAtAmount" | "discountPercent" | "listPriceAmount"
> | null {
  const translation = resolveProductTranslation(product.translations, locale);
  if (!translation) {
    return null;
  }

  return {
    id: product.id,
    sku: product.sku,
    stockOnHand: product.stockOnHand,
    translation,
    imageUrl,
    categoryTitle,
    requiresConfiguration: productRequiresConfiguration(
      parseProductCustomization(product.customization),
    ),
  };
}

async function loadPrimaryProductImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
        eq(mediaAssets.uploadStatus, "READY"),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, "PRIMARY")),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId || map.has(row.productId)) continue;
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

async function loadPrimaryCategoryTitles(
  productIds: string[],
  locale: Locale,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: productCategories.productId,
      translations: categories.translations,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        inArray(productCategories.productId, productIds),
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(
      desc(productCategories.isPrimary),
      asc(productCategories.sortOrder),
    );

  for (const row of rows) {
    if (map.has(row.productId)) continue;
    const translation = resolveProductTranslation(row.translations, locale);
    if (!translation?.title) continue;
    map.set(row.productId, translation.title);
  }

  return map;
}

/** Attaches images, primary category title, and resolved promotion prices. */
export async function withCatalogEnrichment(
  rows: Array<typeof products.$inferSelect>,
  locale: Locale,
): Promise<CatalogProduct[]> {
  const productIds = rows.map((row) => row.id);
  const [images, categoryTitles, prices] = await Promise.all([
    loadPrimaryProductImages(productIds),
    loadPrimaryCategoryTitles(productIds, locale),
    resolveProductPrices(
      rows.map((row) => ({
        id: row.id,
        priceAmount: row.priceAmount,
        compareAtAmount: row.compareAtAmount,
      })),
    ),
  ]);

  return rows
    .map((product) => {
      const base = toCatalogProduct(
        product,
        locale,
        images.get(product.id) ?? null,
        categoryTitles.get(product.id) ?? null,
      );
      if (!base) return null;

      const resolved = prices.get(product.id);
      return {
        ...base,
        listPriceAmount: resolved?.listAmount ?? product.priceAmount,
        priceAmount: resolved?.unitAmount ?? product.priceAmount,
        compareAtAmount: resolved?.compareAtAmount ?? null,
        discountPercent: resolved?.discountPercent ?? null,
      } satisfies CatalogProduct;
    })
    .filter((product): product is CatalogProduct => product !== null);
}
