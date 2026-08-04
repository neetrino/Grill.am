"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import { formatAdminMessage } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
} from "@/features/categories/actions";
import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";
import { AddCategoryDrawer } from "@/features/categories/ui/AddCategoryDrawer";
import enAdmin from "@/locales/en/admin.json";

type AdminCategoriesViewProps = {
  locale: string;
  categories: AdminCategoryListItem[];
};

function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return list;
  next.splice(toIndex, 0, item);
  return next;
}

function sameOrder(
  left: AdminCategoryListItem[],
  right: AdminCategoryListItem[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.id === right[index]?.id);
}

export function AdminCategoriesView({
  locale,
  categories,
}: AdminCategoriesViewProps) {
  // Categories admin is English-only (UI + titles), regardless of admin locale.
  const copy = enAdmin.categories;
  const common = enAdmin.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<AdminCategoryListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [ordered, setOrdered] = useState(categories);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const orderedRef = useRef(ordered);
  const dragOriginRef = useRef<AdminCategoryListItem[] | null>(null);
  const persistedRef = useRef(false);

  useEffect(() => {
    setOrdered(categories);
    orderedRef.current = categories;
  }, [categories]);

  useEffect(() => {
    orderedRef.current = ordered;
  }, [ordered]);

  const needle = query.trim().toLowerCase();
  const isFiltering = needle.length > 0;

  const visible = useMemo(() => {
    if (!isFiltering) return ordered;
    return ordered.filter((category) =>
      category.title.toLowerCase().includes(needle),
    );
  }, [ordered, isFiltering, needle]);

  function handleDelete(categoryId: string): void {
    void (async () => {
      const accepted = await confirmDelete({
        title: common.confirmDeleteTitle,
        message: copy.confirmDelete,
        confirmText: common.delete,
        cancelText: common.cancel,
      });
      if (!accepted) return;

      startTransition(async () => {
        setError(null);
        const result = await deleteCategoryAction(locale, categoryId);
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        router.refresh();
      });
    })();
  }

  function persistCurrentOrder(): void {
    if (persistedRef.current) return;
    const next = orderedRef.current;
    const previous = dragOriginRef.current;
    dragOriginRef.current = null;
    if (!previous || sameOrder(previous, next)) return;

    persistedRef.current = true;
    startTransition(async () => {
      setError(null);
      const result = await reorderCategoriesAction(locale, {
        orderedIds: next.map((category) => category.id),
      });
      if (!result.ok) {
        setOrdered(previous);
        orderedRef.current = previous;
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function reorderToward(targetId: string): void {
    if (!draggingId || isFiltering || draggingId === targetId) return;
    setOrdered((current) => {
      const fromIndex = current.findIndex(
        (category) => category.id === draggingId,
      );
      const toIndex = current.findIndex((category) => category.id === targetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
      const next = moveItem(current, fromIndex, toIndex);
      orderedRef.current = next;
      return next;
    });
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {copy.addCategory}
        </Button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.searchPlaceholder}
        className={`${ADMIN_INPUT} mb-4`}
        aria-label={copy.searchAria}
      />

      {isFiltering ? (
        <p className="mb-3 text-xs text-gray-500">{copy.reorderHint}</p>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <Card className={ADMIN_TABLE_CARD}>
        {visible.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {categories.length === 0 ? copy.empty : copy.emptySearch}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th
                    className={`${ADMIN_TABLE_TH} w-8`}
                    aria-label={copy.reorder}
                  />
                  <th className={ADMIN_TABLE_TH}>{common.image}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.categoryTitle}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.category}</th>
                  <th className={ADMIN_TABLE_TH}>{common.actions}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {visible.map((category) => {
                  const isDragging = draggingId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className={`${ADMIN_TABLE_ROW} ${
                        isDragging ? "bg-gray-50 opacity-50 shadow-sm" : ""
                      }`}
                      onDragOver={(event) => {
                        if (isFiltering || !draggingId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        reorderToward(category.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        persistCurrentOrder();
                        setDraggingId(null);
                      }}
                    >
                      <td className={ADMIN_TABLE_TD}>
                        <button
                          type="button"
                          draggable={!isFiltering && !isPending}
                          disabled={isFiltering || isPending}
                          onDragStart={(event) => {
                            if (isFiltering) {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/plain",
                              category.id,
                            );
                            dragOriginRef.current = orderedRef.current;
                            persistedRef.current = false;
                            setDraggingId(category.id);
                          }}
                          onDragEnd={() => {
                            persistCurrentOrder();
                            setDraggingId(null);
                          }}
                          className="inline-flex cursor-grab touch-none text-gray-400 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={formatAdminMessage(copy.reorderNamed, {
                            title: category.title,
                          })}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">{common.dash}</span>
                          )}
                        </div>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <p className="font-medium text-gray-900">
                          {category.title}
                        </p>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <span className="text-sm text-gray-500">
                          {category.parentTitle ?? copy.rootCategory}
                        </span>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            aria-label={formatAdminMessage(copy.editNamed, {
                              title: category.title,
                            })}
                            onClick={() => {
                              setEditingCategory(category);
                              setDrawerOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(category.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            aria-label={formatAdminMessage(copy.deleteNamed, {
                              title: category.title,
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {category.childCount > 0 ? (
                            <span
                              className="ml-1 text-gray-400"
                              aria-label={formatAdminMessage(
                                copy.subcategoriesCount,
                                { count: String(category.childCount) },
                              )}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddCategoryDrawer
        locale={locale}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        categories={categories}
        category={editingCategory}
      />
    </section>
  );
}
