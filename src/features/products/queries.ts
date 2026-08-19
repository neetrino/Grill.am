import "server-only";

import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
} from "@/db/schema";
import { resolveCategorySubtreeIds } from "@/features/categories/application/resolve-category-subtree-ids";
import { parseProductCustomization, productRequiresConfiguration } from "@/features/products/domain/customization";
import { resolveProductTranslation } from "@/features/products/domain/resolve-translation";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";

function productSlugMatchesAnyLocale(slug: string) {
  return or(
    ...locales.map(
      (loc) => sql`${products.translations}->${loc}->>'slug' = ${slug}`,
    ),
  );
}

const RELATED_PRODUCTS_LIMIT = 4;
export const CATALOG_PAGE_SIZE = 24;

function toCatalogProduct(
  product: typeof products.$inferSelect,
  locale: Locale,
  imageUrl: string | null = null,
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
    categoryTitle: null,
    requiresConfiguration: productRequiresConfiguration(
      parseProductCustomization(product.customization),
    ),
  };
}

async function loadPrimaryProductImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      role: mediaAssets.role,
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
    if (!row.productId || map.has(row.productId)) {
      continue;
    }
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

async function withProductImages(
  rows: Array<typeof products.$inferSelect>,
  locale: Locale,
): Promise<CatalogProduct[]> {
  const productIds = rows.map((row) => row.id);
  const [images, prices] = await Promise.all([
    loadPrimaryProductImages(productIds),
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

/** Storefront visibility filter: published and not soft-deleted. */
export const activeCatalogWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
);

/** Active products by id — used by wishlist (not shared-cache; IDs are user-specific). */
export async function getActiveProductsByIds(
  locale: Locale,
  productIds: string[],
): Promise<CatalogProduct[]> {
  if (productIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), activeCatalogWhere));

  return withProductImages(rows, locale);
}

export type ActiveProductsPageOptions = {
  categorySlug?: string;
};

function normalizeCategorySlug(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : undefined;
}

async function resolveCategoryIdBySlug(
  locale: Locale,
  categorySlug: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
        sql`${categories.translations}->${locale}->>'slug' = ${categorySlug}`,
      ),
    )
    .limit(1);

  return row?.id ?? null;
}

async function loadActiveProductsPage(
  locale: Locale,
  page: number,
  options: ActiveProductsPageOptions = {},
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const categorySlug = normalizeCategorySlug(options.categorySlug);
  const categoryId = categorySlug
    ? await resolveCategoryIdBySlug(locale, categorySlug)
    : null;

  if (categorySlug && !categoryId) {
    return {
      products: [],
      total: 0,
      pageSize: CATALOG_PAGE_SIZE,
    };
  }

  let productIdFilter: string[] | null = null;
  if (categoryId) {
    const categoryIds = await resolveCategorySubtreeIds([categoryId]);
    const links = await getDb()
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, categoryIds));
    productIdFilter = [...new Set(links.map((link) => link.productId))];
    if (productIdFilter.length === 0) {
      return {
        products: [],
        total: 0,
        pageSize: CATALOG_PAGE_SIZE,
      };
    }
  }

  const whereClause =
    productIdFilter != null
      ? and(activeCatalogWhere, inArray(products.id, productIdFilter))
      : activeCatalogWhere;

  const [[countRow], rows] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),
    getDb()
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(CATALOG_PAGE_SIZE)
      .offset(offset),
  ]);

  return {
    products: await withProductImages(rows, locale),
    total: countRow?.count ?? 0,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

/** Paginated active catalog for the storefront (tag-cached). */
export async function getActiveProductsPage(
  locale: Locale,
  page: number,
  options: ActiveProductsPageOptions = {},
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const categorySlug = normalizeCategorySlug(options.categorySlug) ?? "";

  return unstable_cache(
    async () => loadActiveProductsPage(locale, safePage, options),
    ["active-products-page", locale, String(safePage), categorySlug],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

/** @deprecated Prefer getActiveProductsPage — kept for narrow internal callers. */
export async function getActiveProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const result = await getActiveProductsPage(locale, 1);
  if (result.total <= result.pageSize) {
    return result.products;
  }

  const rows = await getDb().select().from(products).where(activeCatalogWhere);
  return withProductImages(rows, locale);
}

const FEATURED_PRODUCTS_LIMIT = 10;

async function loadFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        eq(products.isFeatured, true),
        isNull(products.deletedAt),
      ),
    )
    .limit(FEATURED_PRODUCTS_LIMIT);

  return withProductImages(rows, locale);
}

export async function getFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  return unstable_cache(
    async () => loadFeaturedProducts(locale),
    ["featured-products", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

const DISCOUNTED_PRODUCTS_SCAN_LIMIT = 48;
const DISCOUNTED_PRODUCTS_LIMIT = 8;

async function loadDiscountedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(activeCatalogWhere)
    .orderBy(desc(products.updatedAt))
    .limit(DISCOUNTED_PRODUCTS_SCAN_LIMIT);

  const enriched = await withProductImages(rows, locale);
  return enriched
    .flatMap((product) => {
      const hasAutoDiscount =
        product.discountPercent != null && product.discountPercent > 0;
      const hasManualSale =
        product.compareAtAmount != null &&
        product.compareAtAmount > product.priceAmount;

      if (!hasAutoDiscount && !hasManualSale) {
        return [];
      }

      if (hasAutoDiscount || product.discountPercent != null) {
        return [product];
      }

      const compareAt = product.compareAtAmount;
      if (compareAt == null || compareAt <= 0) {
        return [product];
      }

      const computedPercent = Math.round(
        ((compareAt - product.priceAmount) / compareAt) * 100,
      );

      return [
        {
          ...product,
          discountPercent:
            computedPercent >= 1 && computedPercent <= 100
              ? computedPercent
              : null,
        },
      ];
    })
    .slice(0, DISCOUNTED_PRODUCTS_LIMIT);
}

/** Active products with a resolved discount for the home promotions strip. */
export async function getDiscountedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  return unstable_cache(
    async () => loadDiscountedProducts(locale),
    ["discounted-products", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<CatalogProduct | null> {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
        productSlugMatchesAnyLocale(slug),
      ),
    )
    .limit(1);

  if (!product) {
    return null;
  }

  const [enriched] = await withProductImages([product], locale);
  return enriched ?? null;
}

async function loadProductGallery(
  productId: string,
  locale: Locale,
  fallbackTitle: string,
): Promise<ProductGalleryImage[]> {
  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
      altTranslations: mediaAssets.altTranslations,
    })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.productId, productId),
        eq(mediaAssets.uploadStatus, "READY"),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  return rows
    .map((row) => ({
      id: row.id,
      url: mediaPublicUrl(row.objectKey),
      alt: row.altTranslations?.[locale] ?? fallbackTitle,
      isPrimary: row.isPrimary,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

async function loadProductCategories(
  productId: string,
  locale: Locale,
): Promise<ProductCategoryRef[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
      isPrimary: productCategories.isPrimary,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        eq(productCategories.productId, productId),
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(asc(productCategories.sortOrder));

  return rows
    .map((row) => {
      const translation = resolveProductTranslation(row.translations, locale);
      if (!translation) return null;
      return {
        id: row.id,
        title: translation.title,
        slug: translation.slug,
      } satisfies ProductCategoryRef;
    })
    .filter((row): row is ProductCategoryRef => row !== null);
}

async function loadProductDetailBySlug(
  locale: Locale,
  slug: string,
): Promise<ProductDetail | null> {
  const [row] = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
        productSlugMatchesAnyLocale(slug),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [enriched] = await withProductImages([row], locale);
  if (!enriched) {
    return null;
  }

  const [images, productCats] = await Promise.all([
    loadProductGallery(row.id, locale, enriched.translation.title),
    loadProductCategories(row.id, locale),
  ]);

  const gallery =
    images.length > 0
      ? images
      : enriched.imageUrl
        ? [
            {
              id: row.id,
              url: enriched.imageUrl,
              alt: enriched.translation.title,
              isPrimary: true,
            },
          ]
        : [];

  return {
    ...enriched,
    images: gallery,
    categories: productCats,
    customization: parseProductCustomization(row.customization),
    isFeatured: row.isFeatured,
  };
}

/** Full PDP payload — request-deduped; tagged per-slug so edits don't bust other PDPs. */
export const getProductDetailBySlug = cache(
  async (locale: Locale, slug: string): Promise<ProductDetail | null> => {
    return unstable_cache(
      async () => loadProductDetailBySlug(locale, slug),
      ["product-detail", locale, slug],
      {
        tags: [
          CACHE_TAGS.productDetail,
          CACHE_TAGS.productSlug(locale, slug),
        ],
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);

/** Active products sharing at least one category with the given product. */
export async function getRelatedProducts(
  locale: Locale,
  productId: string,
): Promise<CatalogProduct[]> {
  const seedCategories = getDb()
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  const relatedLinks = await getDb()
    .selectDistinct({ productId: productCategories.productId })
    .from(productCategories)
    .where(
      and(
        inArray(productCategories.categoryId, seedCategories),
        sql`${productCategories.productId} <> ${productId}`,
      ),
    );

  const relatedIds = relatedLinks.map((row) => row.productId);
  if (relatedIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, relatedIds), activeCatalogWhere))
    .limit(RELATED_PRODUCTS_LIMIT);

  return withProductImages(rows, locale);
}
