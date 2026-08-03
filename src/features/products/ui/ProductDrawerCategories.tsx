"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, useTransition } from "react";

import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  DROPDOWN_PANEL_CLASS,
  dropdownPanelStateClass,
} from "@/components/ui/dropdown-styles";
import { createCategoryAction } from "@/features/categories/actions";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";
import type { AdminCategoryOption } from "@/features/products/application/list-admin-products";

type ProductDrawerCategoriesProps = {
  locale: string;
  categories: AdminCategoryOption[];
  selectedIds: string[];
  disabled: boolean;
  onCategoriesChange: (categories: AdminCategoryOption[]) => void;
  onSelectedChange: (ids: string[]) => void;
};

export function ProductDrawerCategories({
  locale,
  categories,
  selectedIds,
  disabled,
  onCategoriesChange,
  onSelectedChange,
}: ProductDrawerCategoriesProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.products.categoriesForm;
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTitles = categories
    .filter((category) => selectedIds.includes(category.id))
    .map((category) => category.title);
  const triggerLabel =
    selectedTitles.length === 0 ? copy.select : selectedTitles.join(", ");

  function toggleCategory(id: string): void {
    if (selectedIds.includes(id)) {
      onSelectedChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onSelectedChange([...selectedIds, id]);
  }

  function createCategory(): void {
    const title = newTitle.trim();
    if (!title) {
      setError(copy.titleRequired);
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await createCategoryAction(locale, {
        // Categories are English-only in admin.
        editingLocale: "en",
        title,
        slug: slugifyCategoryTitle(title),
        parentId: null,
        status: "ACTIVE",
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      const created = { id: result.value.id, title };
      onCategoriesChange([...categories, created]);
      onSelectedChange([...selectedIds, created.id]);
      setNewTitle("");
      setShowAdd(false);
      setOpen(true);
    });
  }

  return (
    <div>
      <span className={ADMIN_LABEL}>{copy.title}</span>
      <div className="relative mt-1">
        <button
          type="button"
          disabled={disabled || isPending}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className={`${ADMIN_SELECT} flex items-center justify-between gap-2 text-left disabled:opacity-50`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedTitles.length === 0 ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {triggerLabel}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        {open ? (
          <div
            id={listId}
            className={`${DROPDOWN_PANEL_CLASS} relative z-20 mt-1.5 max-h-40 space-y-2 px-3 py-2 ${dropdownPanelStateClass(true)}`}
          >
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500">{copy.empty}</p>
            ) : (
              categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 px-1 py-1 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(category.id)}
                    disabled={disabled || isPending}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{category.title}</span>
                </label>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-2">
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => setShowAdd((value) => !value)}
          className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
        >
          {copy.addCategory}
        </button>
      </div>

      {showAdd ? (
        <div className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <label className="block">
            <span className={ADMIN_LABEL}>
              {copy.categoryTitle} <span className="text-red-600">*</span>
            </span>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={copy.categoryTitlePlaceholder}
              className={ADMIN_INPUT}
              disabled={disabled || isPending}
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={disabled || isPending || !newTitle.trim()}
              onClick={createCategory}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? copy.adding : copy.add}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setShowAdd(false);
                setNewTitle("");
                setError(null);
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {dictionary.common.cancel}
            </button>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
