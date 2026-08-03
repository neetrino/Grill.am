"use client";

import { ADMIN_INPUT, ADMIN_LABEL, ADMIN_SELECT } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminCategoryOption } from "@/features/products/application/list-admin-products";

type AdminProductsFiltersProps = {
  total: number;
  q?: string;
  sku?: string;
  categoryId?: string;
  stock: "all" | "in_stock" | "out_of_stock" | "low_stock";
  categories: AdminCategoryOption[];
  sort: string;
  dir: string;
};

export function AdminProductsFilters({
  total,
  q,
  sku,
  categoryId,
  stock,
  categories,
  sort,
  dir,
}: AdminProductsFiltersProps) {
  const dictionary = useAdminDictionary();
  const filters = dictionary.products.filters;

  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-gray-600">
        {formatAdminMessage(filters.totalProducts, { total: String(total) })}
      </p>
      <form
        method="get"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onChange={(event) => {
          if (event.target instanceof HTMLSelectElement) {
            event.currentTarget.requestSubmit();
          }
        }}
      >
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <label>
          <span className={ADMIN_LABEL}>{filters.searchTitleSlug}</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={filters.searchTitleSlugPlaceholder}
            className={ADMIN_INPUT}
            aria-label={filters.searchTitleSlug}
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>{filters.searchSku}</span>
          <input
            name="sku"
            defaultValue={sku ?? ""}
            placeholder={filters.skuPlaceholder}
            className={ADMIN_INPUT}
            aria-label={filters.searchSku}
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>{filters.filterCategory}</span>
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className={ADMIN_SELECT}
            aria-label={filters.filterCategory}
          >
            <option value="">{filters.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ADMIN_LABEL}>{filters.filterStock}</span>
          <select
            name="stock"
            defaultValue={stock}
            className={ADMIN_SELECT}
            aria-label={filters.filterStock}
          >
            <option value="all">{filters.allProducts}</option>
            <option value="in_stock">{filters.inStock}</option>
            <option value="out_of_stock">{filters.outOfStock}</option>
            <option value="low_stock">{filters.lowStock}</option>
          </select>
        </label>
      </form>
    </div>
  );
}
