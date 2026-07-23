"use client";

import { useRouter } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import type { CatalogFilterCategory } from "@/features/products/application/list-catalog-products";
import {
  buildCatalogQuery,
  catalogHref,
  hasActiveCatalogFilters,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";
import { CatalogPriceRangeFilter } from "@/features/products/ui/CatalogPriceRangeFilter";

type CatalogLabels = {
  filters: string;
  search: string;
  searchPlaceholder: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  categories: string;
  inStockOnly: string;
  clearFilters: string;
};

type CatalogFiltersProps = {
  locale: string;
  filters: CatalogFilter;
  categories: CatalogFilterCategory[];
  priceBounds: { min: number; max: number } | null;
  currencySymbol: string;
  labels: CatalogLabels;
};

export function CatalogFilters({
  locale,
  filters,
  categories,
  priceBounds,
  currencySymbol,
  labels,
}: CatalogFiltersProps) {
  const router = useRouter();

  const clearHref = catalogHref(locale, {
    category: [],
    sort: filters.sort,
    page: 1,
    pageSize: filters.pageSize,
  });

  function navigate(overrides: Partial<CatalogFilter>): void {
    const query = buildCatalogQuery(filters, { ...overrides, page: 1 });
    router.push(
      query ? `/${locale}/products?${query}` : `/${locale}/products`,
    );
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
          {labels.filters}
        </h2>
        {hasActiveCatalogFilters(filters) ? (
          <AppLink
            href={clearHref}
            prefetchPolicy="intent"
            className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            {labels.clearFilters}
          </AppLink>
        ) : null}
      </div>

      <div className="space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-800">
            {labels.search}
          </span>
          <input
            type="search"
            defaultValue={filters.q ?? ""}
            key={filters.q ?? ""}
            placeholder={labels.searchPlaceholder}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const value = event.currentTarget.value.trim();
              navigate({ q: value.length > 0 ? value : undefined });
            }}
            onBlur={(event) => {
              const value = event.currentTarget.value.trim();
              const next = value.length > 0 ? value : undefined;
              if (next === filters.q) return;
              navigate({ q: next });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          />
        </label>

        <CatalogPriceRangeFilter
          locale={locale}
          currencySymbol={currencySymbol}
          priceBounds={priceBounds}
          filters={filters}
          labels={{
            price: labels.price,
            minPrice: labels.minPrice,
            maxPrice: labels.maxPrice,
          }}
        />

        {categories.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-800">
              {labels.categories}
            </legend>
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {categories.map((category) => {
                const checked = filters.category.includes(category.slug);
                return (
                  <li key={category.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        value={category.slug}
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...filters.category, category.slug]
                            : filters.category.filter(
                                (slug) => slug !== category.slug,
                              );
                          navigate({ category: next });
                        }}
                        className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="flex-1">{category.title}</span>
                      <span className="text-xs text-gray-400">
                        {category.productCount}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(event) => {
              navigate({
                inStock: event.target.checked ? true : undefined,
              });
            }}
            className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          {labels.inStockOnly}
        </label>
      </div>
    </aside>
  );
}
