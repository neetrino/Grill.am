"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";

import type { CatalogFilterCategory } from "@/features/products/application/list-catalog-products";
import {
  buildCatalogQuery,
  catalogHref,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";
import {
  CatalogAllCategoriesIcon,
  resolveCatalogCategoryIcon,
} from "@/features/products/ui/catalog-category-icon";
import {
  clamp,
  digitCaretIndex,
  digitsOnly,
  formatPriceLabel,
  parseAmountInput,
  resolvePriceBounds,
  toFilterPrice,
} from "@/features/products/ui/catalog-price-range";
import { AppLink } from "@/components/ui/AppLink";

type CatalogLabels = {
  categories: string;
  allCategories: string;
  price: string;
  minPrice: string;
  maxPrice: string;
};

type CatalogFiltersProps = {
  locale: string;
  filters: CatalogFilter;
  categories: CatalogFilterCategory[];
  totalProductCount: number;
  priceBounds: { min: number; max: number } | null;
  currencySymbol: string;
  labels: CatalogLabels;
  /** Desktop rail vs mobile accordion content. */
  variant?: "sidebar" | "panel";
};

const PRICE_INPUT_CLASS =
  "h-[38px] w-full rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] px-[13px] text-sm text-[rgba(10,10,10,0.5)] outline-none transition focus:border-brand-red focus:text-[#0a0a0a]";

export function CatalogFilters({
  locale,
  filters,
  categories,
  totalProductCount,
  priceBounds,
  currencySymbol,
  labels,
  variant = "sidebar",
}: CatalogFiltersProps) {
  const router = useRouter();
  const selectedSlug = filters.category[0] ?? null;
  const isPanel = variant === "panel";
  const shellClass = isPanel
    ? "flex max-h-[min(55dvh,360px)] flex-col bg-white"
    : "flex h-full flex-col border-r border-[#f3f4f6] bg-white shadow-[1px_0_8px_rgba(0,0,0,0.03)]";
  const categoriesScrollClass = isPanel
    ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    : "min-h-0 flex-1 overflow-y-auto px-3.5 pt-4 pb-2";
  const priceFieldsClass = isPanel
    ? "mt-3 grid grid-cols-2 gap-3"
    : "mt-3 space-y-3";
  const { absoluteMin, absoluteMax } = resolvePriceBounds(priceBounds);

  const [minDraft, setMinDraft] = useState(
    filters.minPrice != null
      ? formatPriceLabel(filters.minPrice, locale, currencySymbol)
      : formatPriceLabel(absoluteMin, locale, currencySymbol),
  );
  const [maxDraft, setMaxDraft] = useState(
    filters.maxPrice != null
      ? formatPriceLabel(filters.maxPrice, locale, currencySymbol)
      : formatPriceLabel(absoluteMax, locale, currencySymbol),
  );
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<{
    edge: "min" | "max";
    index: number;
  } | null>(null);

  useEffect(() => {
    setMinDraft(
      formatPriceLabel(
        filters.minPrice ?? absoluteMin,
        locale,
        currencySymbol,
      ),
    );
    setMaxDraft(
      formatPriceLabel(
        filters.maxPrice ?? absoluteMax,
        locale,
        currencySymbol,
      ),
    );
  }, [
    filters.minPrice,
    filters.maxPrice,
    absoluteMin,
    absoluteMax,
    locale,
    currencySymbol,
  ]);

  useLayoutEffect(() => {
    const pending = pendingCaretRef.current;
    if (pending == null) return;
    const input =
      pending.edge === "min" ? minInputRef.current : maxInputRef.current;
    pendingCaretRef.current = null;
    if (input == null) return;
    input.setSelectionRange(pending.index, pending.index);
  }, [minDraft, maxDraft]);

  function navigate(overrides: Partial<CatalogFilter>): void {
    const query = buildCatalogQuery(filters, { ...overrides, page: 1 });
    router.push(
      query ? `/${locale}/products?${query}` : `/${locale}/products`,
    );
  }

  function beginPriceEdit(
    edge: "min" | "max",
    event: FocusEvent<HTMLInputElement>,
  ): void {
    const input = event.currentTarget;
    const digits = digitsOnly(input.value);
    if (digits === input.value) return;

    const caret = input.selectionStart ?? input.value.length;
    const index = digitCaretIndex(input.value, caret);
    pendingCaretRef.current = { edge, index };
    if (edge === "min") setMinDraft(digits);
    else setMaxDraft(digits);
  }

  function changePriceDraft(
    edge: "min" | "max",
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const index = digitCaretIndex(input.value, caret);
    const digits = digitsOnly(input.value);
    const current = edge === "min" ? minDraft : maxDraft;

    if (digits === current) {
      if (input.value !== digits) input.value = digits;
      input.setSelectionRange(index, index);
      return;
    }

    pendingCaretRef.current = { edge, index };
    if (edge === "min") setMinDraft(digits);
    else setMaxDraft(digits);
  }

  function commitPrice(edge: "min" | "max", raw: string): void {
    const parsed = parseAmountInput(raw);
    const currentMin = filters.minPrice ?? absoluteMin;
    const currentMax = filters.maxPrice ?? absoluteMax;

    if (edge === "min") {
      const next = clamp(parsed ?? absoluteMin, absoluteMin, currentMax);
      const minPrice = toFilterPrice(next, absoluteMin, absoluteMax, "min");
      setMinDraft(formatPriceLabel(next, locale, currencySymbol));
      if (minPrice === filters.minPrice) return;
      navigate({ minPrice });
      return;
    }

    const next = clamp(parsed ?? absoluteMax, currentMin, absoluteMax);
    const maxPrice = toFilterPrice(next, absoluteMin, absoluteMax, "max");
    setMaxDraft(formatPriceLabel(next, locale, currencySymbol));
    if (maxPrice === filters.maxPrice) return;
    navigate({ maxPrice });
  }

  return (
    <aside className={shellClass}>
      <div className={categoriesScrollClass}>
        <p className="px-1 text-xs font-semibold tracking-[0.6px] text-[#99a1af] uppercase">
          {labels.categories}
        </p>

        <nav className="mt-3 flex flex-col gap-0.5" aria-label={labels.categories}>
          <CategoryRow
            href={catalogHref(locale, filters, { category: [], page: 1 })}
            title={labels.allCategories}
            count={totalProductCount}
            active={selectedSlug == null}
            Icon={CatalogAllCategoriesIcon}
          />
          {categories.map((category, index) => {
            const active = selectedSlug === category.slug;
            const Icon = resolveCatalogCategoryIcon(
              category.slug,
              category.title,
              index,
            );
            return (
              <CategoryRow
                key={category.id}
                href={catalogHref(locale, filters, {
                  category: [category.slug],
                  page: 1,
                })}
                title={category.title}
                count={category.productCount}
                active={active}
                Icon={Icon}
              />
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#f3f4f6] px-4 pt-[17px] pb-4">
        <p className="px-1 text-xs font-semibold tracking-[0.6px] text-[#99a1af] uppercase">
          {labels.price}
        </p>
        <div className={priceFieldsClass}>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#4a5565]">
              {labels.minPrice}
            </span>
            <input
              ref={minInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={minDraft}
              onFocus={(event) => beginPriceEdit("min", event)}
              onChange={(event) => changePriceDraft("min", event)}
              onBlur={(event) => commitPrice("min", event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                commitPrice("min", event.currentTarget.value);
              }}
              className={PRICE_INPUT_CLASS}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#4a5565]">
              {labels.maxPrice}
            </span>
            <input
              ref={maxInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={maxDraft}
              onFocus={(event) => beginPriceEdit("max", event)}
              onChange={(event) => changePriceDraft("max", event)}
              onBlur={(event) => commitPrice("max", event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                commitPrice("max", event.currentTarget.value);
              }}
              className={PRICE_INPUT_CLASS}
            />
          </label>
        </div>
      </div>
    </aside>
  );
}

type CategoryRowProps = {
  href: string;
  title: string;
  count: number;
  active: boolean;
  Icon: typeof CatalogAllCategoriesIcon;
};

function CategoryRow({ href, title, count, active, Icon }: CategoryRowProps) {
  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition ${
        active ? "bg-[#fff4ee]" : "hover:bg-[#f9fafb]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] ${
          active ? "bg-brand-red text-white" : "bg-[#f3f4f6] text-[#6b7280]"
        }`}
      >
        <Icon className="size-4" strokeWidth={1.5} aria-hidden />
      </span>
      <span
        className={`min-w-0 flex-1 text-sm font-medium ${
          active ? "text-brand-red" : "text-[#374151]"
        }`}
      >
        {title}
      </span>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
          active
            ? "bg-brand-red text-white"
            : "bg-[#e5e7eb] text-[#6b7280]"
        }`}
      >
        {count}
      </span>
    </AppLink>
  );
}
