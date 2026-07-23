"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { ModifierCatalogItem } from "@/features/products/domain/modifier-catalog";
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from "@/features/products/application/list-admin-products";
import { AdminProductsTable } from "@/features/products/ui/AdminProductsTable";
import { ProductDrawer } from "@/features/products/ui/ProductDrawer";

type AdminProductsSortLinks = {
  title: string;
  stock: string;
  price: string;
  created: string;
};

type AdminProductsViewProps = {
  locale: string;
  products: AdminProductListItem[];
  sortLinks: AdminProductsSortLinks;
  categories: AdminCategoryOption[];
  modifierCatalog: ModifierCatalogItem[];
};

export function AdminProductsView({
  locale,
  products,
  sortLinks,
  categories,
  modifierCatalog,
}: AdminProductsViewProps) {
  const dictionary = useAdminDictionary();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<AdminProductListItem | null>(null);

  function openCreate(): void {
    setEditingProduct(null);
    setDrawerOpen(true);
  }

  function openEdit(product: AdminProductListItem): void {
    setDrawerOpen(true);
    setEditingProduct(product);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openCreate}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {dictionary.products.addNew}
      </button>

      <AdminProductsTable
        locale={locale}
        products={products}
        sortLinks={sortLinks}
        onEdit={openEdit}
      />

      <ProductDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        product={editingProduct}
        categories={categories}
        modifierCatalog={modifierCatalog}
      />
    </>
  );
}
