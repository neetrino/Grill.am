import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
  type TranslationsJson,
} from "@/db/schema";
import { resolveCategorySubtreeIds } from "@/features/categories/application/resolve-category-subtree-ids";
import { loadProductImagesForAdmin } from "@/features/products/application/persist-product-media";
import {
  parseProductCustomization,
  type ProductCustomization,
} from "@/features/products/domain/customization";
import { resolveProductTranslation } from "@/features/products/domain/resolve-translation";
import type { AdminProductsFilter } from "@/features/products/schemas/admin-list";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

const PAGE_SIZE = 20;

export type AdminProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type AdminProductListItem = {
  id: string;
  sku: string;
  status: string;
  priceAmount: number;
  compareAtAmount: number | null;
  stockOnHand: number;
  isFeatured: boolean;
  createdAt: Date;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  composition: string;
  /** Full locale key → copy map for admin translation editing. */
  translations: TranslationsJson;
  customization: ProductCustomization | null;
  imageUrl: string | null;
  categoryIds: string[];
  categoryLabels: string[];
  images: AdminProductImage[];
};

export type AdminCategoryOption = {
  id: string;
  title: string;
};

async function buildWhere(
  filters: AdminProductsFilter,
  locale: Locale,
): Promise<SQL | undefined> {
  const conditions: SQL[] = [isNull(products.deletedAt)];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        sql`${products.translations}->${locale}->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->${locale}->>'slug' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'slug' ILIKE ${pattern}`,
      )!,
    );
  }

  if (filters.sku) {
    conditions.push(ilike(products.sku, `%${filters.sku}%`));
  }

  if (filters.stock === "in_stock") {
    conditions.push(gt(products.stockOnHand, 0));
  } else if (filters.stock === "out_of_stock") {
    conditions.push(eq(products.stockOnHand, 0));
  } else if (filters.stock === "low_stock") {
    conditions.push(
      and(gt(products.stockOnHand, 0), lte(products.stockOnHand, products.lowStockThreshold))!,
    );
  }

  if (filters.categoryId) {
    const categoryIds = await resolveCategorySubtreeIds([filters.categoryId]);
    const links = await getDb()
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, categoryIds));
    const productIds = [...new Set(links.map((link) => link.productId))];
    if (productIds.length === 0) {
      conditions.push(sql`false`);
    } else {
      conditions.push(inArray(products.id, productIds));
    }
  }

  return and(...conditions);
}

function orderByClause(filters: AdminProductsFilter, locale: Locale) {
  const direction = filters.dir === "asc" ? asc : desc;
  switch (filters.sort) {
    case "stock":
      return direction(products.stockOnHand);
    case "price":
      return direction(products.priceAmount);
    case "title":
      return direction(
        sql`${products.translations}->${locale}->>'title'`,
      );
    case "created":
    default:
      return direction(products.createdAt);
  }
}

async function loadPrimaryImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
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

async function loadCategoryMeta(
  productIds: string[],
  locale: Locale,
): Promise<Map<string, { ids: string[]; labels: string[] }>> {
  const map = new Map<string, { ids: string[]; labels: string[] }>();
  if (productIds.length === 0) return map;

  const rows = await getDb()
    .select({
      productId: productCategories.productId,
      categoryId: productCategories.categoryId,
      translations: categories.translations,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(inArray(productCategories.productId, productIds))
    .orderBy(asc(productCategories.sortOrder));

  for (const row of rows) {
    const title =
      resolveProductTranslation(row.translations, locale)?.title ?? "Category";
    const entry = map.get(row.productId) ?? { ids: [], labels: [] };
    entry.ids.push(row.categoryId);
    entry.labels.push(title);
    map.set(row.productId, entry);
  }
  return map;
}

/** Lists products for the admin catalog table with filters and sort. */
export async function listAdminProducts(
  locale: Locale,
  filters: AdminProductsFilter,
): Promise<{ rows: AdminProductListItem[]; total: number; pageSize: number }> {
  const where = await buildWhere(filters, locale);
  const db = getDb();

  const [totalRow] = await db
    .select({ value: count() })
    .from(products)
    .where(where);

  const total = totalRow?.value ?? 0;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(orderByClause(filters, locale))
    .limit(PAGE_SIZE)
    .offset(offset);

  const ids = rows.map((row) => row.id);
  const [primaryImages, categoryMap, galleryImages] = await Promise.all([
    loadPrimaryImages(ids),
    loadCategoryMeta(ids, locale),
    loadProductImagesForAdmin(ids),
  ]);

  return {
    total,
    pageSize: PAGE_SIZE,
    rows: rows.map((product) => {
      const translation = resolveProductTranslation(product.translations, locale);
      const categoryMeta = categoryMap.get(product.id);
      return {
        id: product.id,
        sku: product.sku,
        status: product.status,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
        stockOnHand: product.stockOnHand,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt,
        title: translation?.title ?? product.sku,
        slug: translation?.slug ?? "",
        description: translation?.description ?? "",
        shortDescription: translation?.shortDescription ?? "",
        composition: translation?.composition ?? "",
        translations: product.translations,
        customization: parseProductCustomization(product.customization),
        imageUrl: primaryImages.get(product.id) ?? null,
        categoryIds: categoryMeta?.ids ?? [],
        categoryLabels: categoryMeta?.labels ?? [],
        images: galleryImages.get(product.id) ?? [],
      };
    }),
  };
}

/** Active categories for the admin products filter dropdown. */
export async function listAdminCategoryOptions(
  locale: Locale,
): Promise<AdminCategoryOption[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    title:
      row.translations[locale]?.title ??
      row.translations.en?.title ??
      row.translations.hy?.title ??
      row.translations.ru?.title ??
      "Category",
  }));
}
