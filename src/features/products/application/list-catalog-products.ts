import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { categories, productCategories, products } from "@/db/schema";
import { withCatalogEnrichment } from "@/features/products/application/catalog-enrichment";
import {
  amdToDisplayMajor,
  displayMajorToAmd,
} from "@/features/products/application/catalog-price-bounds";
import { resolveProductTranslation } from "@/features/products/domain/resolve-translation";
import type { CatalogFilter } from "@/features/products/schemas/catalog-list";
import type { CatalogProduct } from "@/features/products/types";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type CatalogFilterCategory = {
  id: string;
  title: string;
  slug: string;
  productCount: number;
};

export type CatalogListResult = {
  products: CatalogProduct[];
  total: number;
  pageSize: number;
  page: number;
  priceBoundsAmd: { min: number; max: number } | null;
  priceBoundsDisplay: { min: number; max: number } | null;
  categories: CatalogFilterCategory[];
};

const activeCatalogWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
);

async function resolveCategoryIdsBySlugs(
  locale: Locale,
  slugs: string[],
): Promise<string[]> {
  if (slugs.length === 0) return [];

  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
    })
    .from(categories)
    .where(
      and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)),
    );

  const wanted = new Set(slugs);
  return rows
    .filter((row) => {
      const translation = resolveProductTranslation(row.translations, locale);
      return translation?.slug != null && wanted.has(translation.slug);
    })
    .map((row) => row.id);
}

function buildOrderBy(sort: CatalogFilter["sort"]) {
  switch (sort) {
    case "price_asc":
      return [
        asc(products.priceAmount),
        desc(products.createdAt),
        asc(products.id),
      ];
    case "price_desc":
      return [
        desc(products.priceAmount),
        desc(products.createdAt),
        asc(products.id),
      ];
    case "popular":
      return [
        desc(products.isFeatured),
        desc(products.createdAt),
        asc(products.id),
      ];
    case "newest":
    default:
      return [desc(products.createdAt), asc(products.id)];
  }
}

async function buildWhere(
  locale: Locale,
  filters: CatalogFilter,
  priceAmd: { min?: number; max?: number },
): Promise<SQL | undefined> {
  const conditions: SQL[] = [
    eq(products.status, "ACTIVE"),
    isNull(products.deletedAt),
  ];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        sql`${products.translations}->${locale}->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->${locale}->>'slug' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'title' ILIKE ${pattern}`,
        sql`${products.translations}->'hy'->>'slug' ILIKE ${pattern}`,
        sql`${products.sku} ILIKE ${pattern}`,
      )!,
    );
  }

  if (filters.inStock === true) {
    conditions.push(gt(products.stockOnHand, 0));
  } else if (filters.inStock === false) {
    conditions.push(eq(products.stockOnHand, 0));
  }

  if (priceAmd.min != null) {
    conditions.push(gte(products.priceAmount, priceAmd.min));
  }
  if (priceAmd.max != null) {
    conditions.push(lte(products.priceAmount, priceAmd.max));
  }

  if (filters.category.length > 0) {
    const categoryIds = await resolveCategoryIdsBySlugs(
      locale,
      filters.category,
    );
    if (categoryIds.length === 0) {
      conditions.push(sql`false`);
    } else {
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
  }

  return and(...conditions);
}

async function loadFilterCategories(
  locale: Locale,
): Promise<CatalogFilterCategory[]> {
  const [categoryRows, countRows] = await Promise.all([
    getDb()
      .select({
        id: categories.id,
        translations: categories.translations,
      })
      .from(categories)
      .where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)))
      .orderBy(asc(categories.sortOrder), asc(categories.createdAt)),
    getDb()
      .select({
        categoryId: productCategories.categoryId,
        productCount: sql<number>`count(*)::int`,
      })
      .from(productCategories)
      .innerJoin(products, eq(products.id, productCategories.productId))
      .where(activeCatalogWhere)
      .groupBy(productCategories.categoryId),
  ]);

  const counts = new Map(
    countRows.map((row) => [row.categoryId, row.productCount]),
  );

  return categoryRows.flatMap((row) => {
    const translation = resolveProductTranslation(row.translations, locale);
    if (!translation?.slug) return [];
    return [
      {
        id: row.id,
        title: translation.title,
        slug: translation.slug,
        productCount: counts.get(row.id) ?? 0,
      },
    ];
  });
}

async function loadPriceBoundsAmd(): Promise<{
  min: number;
  max: number;
} | null> {
  const [row] = await getDb()
    .select({
      min: sql<number>`min(${products.priceAmount})::int`,
      max: sql<number>`max(${products.priceAmount})::int`,
    })
    .from(products)
    .where(activeCatalogWhere);

  if (row?.min == null || row.max == null) return null;
  return { min: row.min, max: row.max };
}

async function loadCatalogPage(
  locale: Locale,
  filters: CatalogFilter,
  displayCurrency: Currency,
  rate: string,
): Promise<CatalogListResult> {
  const priceAmd = {
    min:
      filters.minPrice != null
        ? displayMajorToAmd(filters.minPrice, displayCurrency, rate)
        : undefined,
    max:
      filters.maxPrice != null
        ? displayMajorToAmd(filters.maxPrice, displayCurrency, rate)
        : undefined,
  };

  const whereClause = await buildWhere(locale, filters, priceAmd);
  const offset = (filters.page - 1) * filters.pageSize;

  const [[countRow], rows, filterCategories, boundsAmd] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),
    getDb()
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...buildOrderBy(filters.sort))
      .limit(filters.pageSize)
      .offset(offset),
    loadFilterCategories(locale),
    loadPriceBoundsAmd(),
  ]);

  return {
    products: await withCatalogEnrichment(rows, locale),
    total: countRow?.count ?? 0,
    pageSize: filters.pageSize,
    page: filters.page,
    priceBoundsAmd: boundsAmd,
    priceBoundsDisplay: boundsAmd
      ? {
          min: amdToDisplayMajor(boundsAmd.min, displayCurrency, rate),
          max: amdToDisplayMajor(boundsAmd.max, displayCurrency, rate),
        }
      : null,
    categories: filterCategories,
  };
}

/**
 * Filtered/sorted/paginated storefront catalog.
 * Price URL params are display-currency major units; filtering uses base AMD.
 */
export async function listCatalogProducts(
  locale: Locale,
  filters: CatalogFilter,
  displayCurrency: Currency,
  rate: string,
): Promise<CatalogListResult> {
  const cacheKey = [
    "catalog-products",
    locale,
    displayCurrency,
    rate,
    filters.q ?? "",
    String(filters.minPrice ?? ""),
    String(filters.maxPrice ?? ""),
    filters.category.join(","),
    String(filters.inStock ?? ""),
    filters.sort,
    String(filters.page),
    String(filters.pageSize),
  ];

  return unstable_cache(
    async () => loadCatalogPage(locale, filters, displayCurrency, rate),
    cacheKey,
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
