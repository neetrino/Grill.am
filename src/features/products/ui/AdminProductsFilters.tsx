"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ADMIN_INPUT, ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
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
  const router = useRouter();
  const filters = dictionary.products.filters;
  const [queryValue, setQueryValue] = useState(q ?? "");
  const [skuValue, setSkuValue] = useState(sku ?? "");
  const [categoryValue, setCategoryValue] = useState(categoryId ?? "");
  const [stockValue, setStockValue] = useState(stock);

  const categoryOptions = [
    { value: "", label: filters.allCategories },
    ...categories.map((category) => ({
      value: category.id,
      label: category.title,
    })),
  ];

  const stockOptions = [
    { value: "all", label: filters.allProducts },
    { value: "in_stock", label: filters.inStock },
    { value: "out_of_stock", label: filters.outOfStock },
    { value: "low_stock", label: filters.lowStock },
  ];

  const pushFilters = useCallback(
    (next: {
      q: string;
      sku: string;
      categoryId: string;
      stock: string;
    }) => {
      const params = new URLSearchParams();
      params.set("sort", sort);
      params.set("dir", dir);
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.sku.trim()) params.set("sku", next.sku.trim());
      if (next.categoryId) params.set("categoryId", next.categoryId);
      if (next.stock && next.stock !== "all") params.set("stock", next.stock);
      const query = params.toString();
      router.push(query ? `?${query}` : "?");
    },
    [dir, router, sort],
  );

  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-gray-600">
        {formatAdminMessage(filters.totalProducts, { total: String(total) })}
      </p>
      <form
        method="get"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          pushFilters({
            q: queryValue,
            sku: skuValue,
            categoryId: categoryValue,
            stock: stockValue,
          });
        }}
      >
        <label>
          <span className={ADMIN_LABEL}>{filters.searchTitleSlug}</span>
          <input
            name="q"
            value={queryValue}
            onChange={(event) => setQueryValue(event.target.value)}
            placeholder={filters.searchTitleSlugPlaceholder}
            className={ADMIN_INPUT}
            aria-label={filters.searchTitleSlug}
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>{filters.searchSku}</span>
          <input
            name="sku"
            value={skuValue}
            onChange={(event) => setSkuValue(event.target.value)}
            placeholder={filters.skuPlaceholder}
            className={ADMIN_INPUT}
            aria-label={filters.searchSku}
          />
        </label>
        <AdminSelect
          label={filters.filterCategory}
          placeholder={filters.allCategories}
          options={categoryOptions}
          value={categoryValue}
          onChange={(value) => {
            setCategoryValue(value);
            pushFilters({
              q: queryValue,
              sku: skuValue,
              categoryId: value,
              stock: stockValue,
            });
          }}
        />
        <AdminSelect
          label={filters.filterStock}
          placeholder={filters.allProducts}
          options={stockOptions}
          value={stockValue}
          onChange={(value) => {
            setStockValue(
              value as "all" | "in_stock" | "out_of_stock" | "low_stock",
            );
            pushFilters({
              q: queryValue,
              sku: skuValue,
              categoryId: categoryValue,
              stock: value,
            });
          }}
        />
      </form>
    </div>
  );
}
