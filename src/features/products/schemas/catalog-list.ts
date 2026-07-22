import { z } from "zod";

export const CATALOG_SORT_VALUES = [
  "newest",
  "price_asc",
  "price_desc",
  "popular",
] as const;

export type CatalogSort = (typeof CATALOG_SORT_VALUES)[number];

export const CATALOG_PAGE_SIZES = [12, 24, 48] as const;

export type CatalogPageSize = (typeof CATALOG_PAGE_SIZES)[number];

const optionalTrimmedQuery = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(100).optional());

const optionalNonNegativeInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}, z.coerce.number().int().min(0).max(1_000_000_000).optional());

const categorySlugsSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return [];
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().slice(0, 120))
    .filter((entry) => entry.length > 0)
    .slice(0, 20);
}, z.array(z.string().min(1).max(120)).max(20));

const optionalInStock = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
}, z.boolean().optional());

const pageSizeSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return 24;
  return value;
}, z.coerce.number().pipe(z.union([z.literal(12), z.literal(24), z.literal(48)])));

export const catalogFilterSchema = z
  .object({
    q: optionalTrimmedQuery,
    minPrice: optionalNonNegativeInt,
    maxPrice: optionalNonNegativeInt,
    category: categorySlugsSchema.default([]),
    inStock: optionalInStock,
    sort: z.enum(CATALOG_SORT_VALUES).default("newest"),
    page: z.coerce.number().int().min(1).max(500).default(1),
    pageSize: pageSizeSchema.default(24),
  })
  .superRefine((data, ctx) => {
    if (
      data.minPrice != null &&
      data.maxPrice != null &&
      data.maxPrice < data.minPrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: "maxPrice must be >= minPrice",
      });
    }
  });

export type CatalogFilter = z.infer<typeof catalogFilterSchema>;

const CATALOG_DEFAULTS: CatalogFilter = {
  category: [],
  sort: "newest",
  page: 1,
  pageSize: 24,
};

/**
 * Parses storefront catalog search params; invalid values fall back to defaults.
 */
export function parseCatalogSearchParams(
  raw: Record<string, string | string[] | undefined>,
): CatalogFilter {
  const first = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const parsed = catalogFilterSchema.safeParse({
    q: first(raw.q),
    minPrice: first(raw.minPrice),
    maxPrice: first(raw.maxPrice),
    category: raw.category,
    inStock: first(raw.inStock),
    sort: first(raw.sort) ?? "newest",
    page: first(raw.page) ?? "1",
    pageSize: first(raw.pageSize) ?? "24",
  });

  return parsed.success ? parsed.data : { ...CATALOG_DEFAULTS };
}

/** Builds a query string for catalog navigation (omits defaults). */
export function buildCatalogQuery(
  filters: CatalogFilter,
  overrides: Partial<CatalogFilter> = {},
): string {
  const merged: CatalogFilter = {
    ...filters,
    ...overrides,
    category: overrides.category ?? filters.category,
  };

  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.minPrice != null) params.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice != null) params.set("maxPrice", String(merged.maxPrice));
  for (const slug of merged.category) {
    params.append("category", slug);
  }
  if (merged.inStock === true) params.set("inStock", "true");
  if (merged.inStock === false) params.set("inStock", "false");
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.pageSize !== 24) params.set("pageSize", String(merged.pageSize));
  if (merged.page > 1) params.set("page", String(merged.page));

  return params.toString();
}

export function catalogHref(
  locale: string,
  filters: CatalogFilter,
  overrides: Partial<CatalogFilter> = {},
): string {
  const query = buildCatalogQuery(filters, overrides);
  return query ? `/${locale}/products?${query}` : `/${locale}/products`;
}

/** True when any non-pagination catalog filter is active. */
export function hasActiveCatalogFilters(filters: CatalogFilter): boolean {
  return Boolean(
    filters.q ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.category.length > 0 ||
      filters.inStock != null,
  );
}
