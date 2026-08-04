import { X } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { CatalogFilterCategory } from "@/features/products/application/list-catalog-products";
import {
  catalogHref,
  hasActiveCatalogFilters,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";

type CatalogActiveChipsProps = {
  locale: string;
  filters: CatalogFilter;
  categories: CatalogFilterCategory[];
  currencyCode: string;
  labels: {
    searchChip: string;
    minPriceChip: string;
    maxPriceChip: string;
    inStockChip: string;
    onSaleChip: string;
    removeFilter: string;
  };
};

export function CatalogActiveChips({
  locale,
  filters,
  categories,
  currencyCode,
  labels,
}: CatalogActiveChipsProps) {
  if (!hasActiveCatalogFilters(filters)) {
    return null;
  }

  const categoryTitleBySlug = new Map(
    categories.map((category) => [category.slug, category.title]),
  );

  const chips: Array<{ key: string; label: string; href: string }> = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: labels.searchChip.replace("{q}", filters.q),
      href: catalogHref(locale, filters, { q: undefined, page: 1 }),
    });
  }

  if (filters.minPrice != null) {
    chips.push({
      key: "minPrice",
      label: labels.minPriceChip
        .replace("{amount}", String(filters.minPrice))
        .replace("{currency}", currencyCode),
      href: catalogHref(locale, filters, { minPrice: undefined, page: 1 }),
    });
  }

  if (filters.maxPrice != null) {
    chips.push({
      key: "maxPrice",
      label: labels.maxPriceChip
        .replace("{amount}", String(filters.maxPrice))
        .replace("{currency}", currencyCode),
      href: catalogHref(locale, filters, { maxPrice: undefined, page: 1 }),
    });
  }

  for (const slug of filters.category) {
    chips.push({
      key: `category-${slug}`,
      label: categoryTitleBySlug.get(slug) ?? slug,
      href: catalogHref(locale, filters, {
        category: filters.category.filter((value) => value !== slug),
        page: 1,
      }),
    });
  }

  if (filters.inStock === true) {
    chips.push({
      key: "inStock",
      label: labels.inStockChip,
      href: catalogHref(locale, filters, { inStock: undefined, page: 1 }),
    });
  }

  if (filters.onSale === true) {
    chips.push({
      key: "onSale",
      label: labels.onSaleChip,
      href: catalogHref(locale, filters, { onSale: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label={labels.removeFilter}>
      {chips.map((chip) => (
        <li key={chip.key}>
          <AppLink
            href={chip.href}
            prefetchPolicy="intent"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            aria-label={`${labels.removeFilter}: ${chip.label}`}
          >
            <span>{chip.label}</span>
            <X className="size-3.5" aria-hidden />
          </AppLink>
        </li>
      ))}
    </ul>
  );
}
