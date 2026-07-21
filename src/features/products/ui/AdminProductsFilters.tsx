"use client";

import { ADMIN_INPUT, ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
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
  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-gray-600">Total products: {total}</p>
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
          <span className={ADMIN_LABEL}>Search by title or slug</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by title or slug..."
            className={ADMIN_INPUT}
            aria-label="Search by title or slug"
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>Search by SKU</span>
          <input
            name="sku"
            defaultValue={sku ?? ""}
            placeholder="Enter SKU code"
            className={ADMIN_INPUT}
            aria-label="Search by SKU"
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>Filter by Category</span>
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className={ADMIN_INPUT}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ADMIN_LABEL}>Filter by Stock</span>
          <select
            name="stock"
            defaultValue={stock}
            className={ADMIN_INPUT}
            aria-label="Filter by stock"
          >
            <option value="all">All Products</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="low_stock">Low stock</option>
          </select>
        </label>
      </form>
    </div>
  );
}
