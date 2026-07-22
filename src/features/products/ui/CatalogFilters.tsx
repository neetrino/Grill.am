import { AppLink } from "@/components/ui/AppLink";
import {
  catalogHref,
  hasActiveCatalogFilters,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";
import type { CatalogFilterCategory } from "@/features/products/application/list-catalog-products";

type CatalogLabels = {
  filters: string;
  search: string;
  searchPlaceholder: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  categories: string;
  inStockOnly: string;
  applyFilters: string;
  clearFilters: string;
  currencyNote: string;
};

type CatalogFiltersProps = {
  locale: string;
  filters: CatalogFilter;
  categories: CatalogFilterCategory[];
  priceBounds: { min: number; max: number } | null;
  currencyCode: string;
  labels: CatalogLabels;
};

export function CatalogFilters({
  locale,
  filters,
  categories,
  priceBounds,
  currencyCode,
  labels,
}: CatalogFiltersProps) {
  const clearHref = catalogHref(locale, {
    category: [],
    sort: filters.sort,
    page: 1,
    pageSize: filters.pageSize,
  });

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

      <form method="get" className="space-y-6">
        {filters.sort !== "newest" ? (
          <input type="hidden" name="sort" value={filters.sort} />
        ) : null}
        {filters.pageSize !== 24 ? (
          <input type="hidden" name="pageSize" value={filters.pageSize} />
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-800">
            {labels.search}
          </span>
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-800">
            {labels.price}
          </legend>
          <p className="text-xs text-gray-500">
            {labels.currencyNote.replace("{currency}", currencyCode)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="sr-only">{labels.minPrice}</span>
              <input
                type="number"
                name="minPrice"
                min={0}
                inputMode="numeric"
                defaultValue={filters.minPrice ?? ""}
                placeholder={
                  priceBounds
                    ? String(priceBounds.min)
                    : labels.minPrice
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </label>
            <label className="block space-y-1">
              <span className="sr-only">{labels.maxPrice}</span>
              <input
                type="number"
                name="maxPrice"
                min={0}
                inputMode="numeric"
                defaultValue={filters.maxPrice ?? ""}
                placeholder={
                  priceBounds
                    ? String(priceBounds.max)
                    : labels.maxPrice
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </label>
          </div>
        </fieldset>

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
                        name="category"
                        value={category.slug}
                        defaultChecked={checked}
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
            name="inStock"
            value="true"
            defaultChecked={filters.inStock === true}
            className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          {labels.inStockOnly}
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          {labels.applyFilters}
        </button>
      </form>
    </aside>
  );
}
