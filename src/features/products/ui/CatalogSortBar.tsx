"use client";

import { useRouter } from "next/navigation";

import {
  buildCatalogQuery,
  type CatalogFilter,
  type CatalogSort,
} from "@/features/products/schemas/catalog-list";

type CatalogSortLabels = {
  popular: string;
  newest: string;
  onSale: string;
};

type CatalogSortBarProps = {
  locale: string;
  filters: CatalogFilter;
  labels: CatalogSortLabels;
};

type SortTabId = "popular" | "newest" | "onSale";

export function CatalogSortBar({
  locale,
  filters,
  labels,
}: CatalogSortBarProps) {
  const router = useRouter();

  const activeTab: SortTabId =
    filters.onSale === true
      ? "onSale"
      : filters.sort === "popular"
        ? "popular"
        : "newest";

  const tabs: Array<{
    id: SortTabId;
    label: string;
    overrides: Partial<CatalogFilter>;
  }> = [
    {
      id: "popular",
      label: labels.popular,
      overrides: { sort: "popular" as CatalogSort, onSale: undefined, page: 1 },
    },
    {
      id: "newest",
      label: labels.newest,
      overrides: { sort: "newest" as CatalogSort, onSale: undefined, page: 1 },
    },
    {
      id: "onSale",
      label: labels.onSale,
      overrides: { onSale: true, page: 1 },
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              const query = buildCatalogQuery(filters, tab.overrides);
              router.push(
                query ? `/${locale}/products?${query}` : `/${locale}/products`,
              );
            }}
            className={`inline-flex h-[34px] items-center rounded-full px-4 text-sm font-semibold transition ${
              active
                ? "bg-brand-red text-white"
                : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
