"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import { createCategoryAction } from "@/features/categories/actions";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";
import type { AdminCategoryOption } from "@/features/products/application/list-admin-products";

function subscribeNoop(): () => void {
  return () => undefined;
}

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
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const menuPosition = useDropdownPortalPosition(panelVisible, triggerRef, {
    matchTriggerWidth: true,
    lockTriggerWidth: true,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeDropdown = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
    setPanelExpanded(false);
    closeTimerRef.current = setTimeout(() => {
      setPanelVisible(false);
      closeTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }, [clearCloseTimer]);

  const openDropdown = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
    setPanelVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelExpanded(true);
      });
    });
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeDropdown();
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDropdown();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closeDropdown, open]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

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
      openDropdown();
    });
  }

  return (
    <div>
      <span className={ADMIN_LABEL}>{copy.title}</span>
      <div ref={rootRef} className="relative mt-1">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || isPending}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (open) {
              closeDropdown();
              return;
            }
            openDropdown();
          }}
          className={`flex h-11 w-full items-center justify-between gap-3 rounded-[15px] border bg-white px-3 text-left transition-colors outline-none focus-visible:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red/15 disabled:cursor-not-allowed disabled:opacity-50 ${
            open ? "border-brand-red" : "border-gray-200"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              selectedTitles.length === 0 ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {triggerLabel}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        {canPortal && panelVisible && menuPosition
          ? createPortal(
              <div
                ref={panelRef}
                id={listId}
                className={`${DROPDOWN_PANEL_PORTAL_CLASS} max-h-40 space-y-2 px-3 py-2 ${dropdownPanelStateClass(panelExpanded)}`}
                style={dropdownPortalStyle(menuPosition)}
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
                        className="h-4 w-4 rounded border-gray-300 accent-brand-yellow text-brand-yellow focus:ring-brand-yellow"
                      />
                      <span>{category.title}</span>
                    </label>
                  ))
                )}
              </div>,
              getDropdownPortalRoot(),
            )
          : null}
      </div>

      <div className="mt-2">
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => setShowAdd((value) => !value)}
          className={ADMIN_BTN_DASHED_CLASS}
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
