"use client";

import { useRouter } from "next/navigation";

import {
  buildCatalogQuery,
  type CatalogFilter,
  type CatalogSort,
} from "@/features/products/schemas/catalog-list";

type CatalogSortLabels = {
  sortLabel: string;
  newest: string;
  priceAsc: string;
  priceDesc: string;
  popular: string;
  resultsCount: string;
};

type CatalogSortBarProps = {
  locale: string;
  filters: CatalogFilter;
  total: number;
  labels: CatalogSortLabels;
};

const SORT_OPTIONS: CatalogSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "popular",
];

export function CatalogSortBar({
  locale,
  filters,
  total,
  labels,
}: CatalogSortBarProps) {
  const router = useRouter();

  const sortLabelMap: Record<CatalogSort, string> = {
    newest: labels.newest,
    price_asc: labels.priceAsc,
    price_desc: labels.priceDesc,
    popular: labels.popular,
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        {labels.resultsCount.replace("{count}", String(total))}
      </p>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <span className="whitespace-nowrap">{labels.sortLabel}</span>
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          value={filters.sort}
          aria-label={labels.sortLabel}
          onChange={(event) => {
            const sort = event.target.value as CatalogSort;
            const query = buildCatalogQuery(filters, { sort, page: 1 });
            router.push(
              query ? `/${locale}/products?${query}` : `/${locale}/products`,
            );
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {sortLabelMap[option]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
