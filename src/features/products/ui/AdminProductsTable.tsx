"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  duplicateProductAction,
  softDeleteProductsAction,
  toggleProductFeaturedAction,
  toggleProductVisibilityAction,
} from "@/features/products/application/admin-product-actions";
import type { AdminProductListItem } from "@/features/products/application/list-admin-products";
import { AdminProductRow } from "@/features/products/ui/AdminProductRow";

type AdminProductsSortLinks = {
  title: string;
  stock: string;
  price: string;
  created: string;
};

type AdminProductsTableProps = {
  locale: string;
  products: AdminProductListItem[];
  sortLinks: AdminProductsSortLinks;
  onEdit: (product: AdminProductListItem) => void;
};

export function AdminProductsTable({
  locale,
  products,
  sortLinks,
  onEdit,
}: AdminProductsTableProps) {
  const router = useRouter();
  const dictionary = useAdminDictionary();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allIds = products.map((product) => product.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function runAction(action: () => Promise<void>): void {
    startTransition(async () => {
      setError(null);
      try {
        await action();
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : dictionary.common.actionsFailed,
        );
      }
    });
  }

  function deleteSelected(): void {
    if (selected.size === 0) return;
    runAction(async () => {
      const result = await softDeleteProductsAction(locale, {
        productIds: [...selected],
      });
      if (!result.ok) throw new Error(result.error.message);
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-gray-700">
          {formatAdminMessage(dictionary.products.bulk.selectedCount, {
            count: String(selected.size),
          })}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={isPending || selected.size === 0}
          onClick={deleteSelected}
        >
          {dictionary.products.bulk.deleteSelected}
        </Button>
      </Card>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Card className={ADMIN_TABLE_CARD}>
        {products.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {dictionary.products.table.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH_CHECK}>
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isPending}
                      aria-label={dictionary.products.selectAll}
                    />
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    <Link href={sortLinks.title} className="hover:text-gray-900">
                      {dictionary.products.table.product}
                    </Link>
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    <Link href={sortLinks.stock} className="hover:text-gray-900">
                      {dictionary.products.table.stock}
                    </Link>
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    <Link href={sortLinks.price} className="hover:text-gray-900">
                      {dictionary.products.table.price}
                    </Link>
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    {dictionary.products.table.category}
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    {dictionary.products.table.featured}
                  </th>
                  <th className={ADMIN_TABLE_TH}>{dictionary.common.actions}</th>
                  <th className={ADMIN_TABLE_TH}>
                    <Link
                      href={sortLinks.created}
                      className="hover:text-gray-900"
                    >
                      {dictionary.common.created}
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {products.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    locale={locale}
                    product={product}
                    selected={selected.has(product.id)}
                    disabled={isPending}
                    onToggle={() => toggleOne(product.id)}
                    onEdit={() => onEdit(product)}
                    onFeatured={() =>
                      runAction(async () => {
                        const result = await toggleProductFeaturedAction(
                          locale,
                          product.id,
                        );
                        if (!result.ok) throw new Error(result.error.message);
                      })
                    }
                    onDuplicate={() =>
                      runAction(async () => {
                        const result = await duplicateProductAction(
                          locale,
                          product.id,
                        );
                        if (!result.ok) throw new Error(result.error.message);
                      })
                    }
                    onDelete={() =>
                      runAction(async () => {
                        const result = await softDeleteProductsAction(locale, {
                          productIds: [product.id],
                        });
                        if (!result.ok) throw new Error(result.error.message);
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.delete(product.id);
                          return next;
                        });
                      })
                    }
                    onVisibility={() =>
                      runAction(async () => {
                        const result = await toggleProductVisibilityAction(
                          locale,
                          product.id,
                        );
                        if (!result.ok) throw new Error(result.error.message);
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
