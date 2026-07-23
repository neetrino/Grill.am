"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  buildCatalogQuery,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";
import {
  clamp,
  digitsOnly,
  formatPriceLabel,
  parseAmountInput,
  PRICE_RANGE_COLORS,
  PRICE_RANGE_THUMB_CLASS,
  resolvePriceBounds,
  toFilterPrice,
} from "@/features/products/ui/catalog-price-range";

type PriceBounds = { min: number; max: number };

type CatalogPriceRangeFilterProps = {
  locale: string;
  currencySymbol: string;
  priceBounds: PriceBounds | null;
  filters: CatalogFilter;
  labels: {
    price: string;
    minPrice: string;
    maxPrice: string;
  };
};

const VALUE_INPUT_CLASS =
  "w-full rounded-2xl bg-white px-3 py-2.5 text-center text-[15px] font-bold text-[#4D7CFE] shadow-[0_1px_3px_rgba(16,24,40,0.08)] outline-none ring-1 ring-black/[0.04] focus:ring-2 focus:ring-[#4D7CFE]/35";

export function CatalogPriceRangeFilter({
  locale,
  currencySymbol,
  priceBounds,
  filters,
  labels,
}: CatalogPriceRangeFilterProps) {
  const router = useRouter();
  const baseId = useId();
  const { absoluteMin, absoluteMax } = resolvePriceBounds(priceBounds);

  const [minValue, setMinValue] = useState(() =>
    clamp(filters.minPrice ?? absoluteMin, absoluteMin, absoluteMax),
  );
  const [maxValue, setMaxValue] = useState(() =>
    clamp(filters.maxPrice ?? absoluteMax, absoluteMin, absoluteMax),
  );
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

  useEffect(() => {
    setMinValue(
      clamp(filters.minPrice ?? absoluteMin, absoluteMin, absoluteMax),
    );
    setMaxValue(
      clamp(filters.maxPrice ?? absoluteMax, absoluteMin, absoluteMax),
    );
    setMinDraft(null);
    setMaxDraft(null);
  }, [filters.minPrice, filters.maxPrice, absoluteMin, absoluteMax]);

  const range = absoluteMax - absoluteMin;
  const leftPercent = ((minValue - absoluteMin) / range) * 100;
  const rightPercent = ((maxValue - absoluteMin) / range) * 100;

  function navigateToRange(nextMin: number, nextMax: number): void {
    const minPrice = toFilterPrice(nextMin, absoluteMin, absoluteMax, "min");
    const maxPrice = toFilterPrice(nextMax, absoluteMin, absoluteMax, "max");

    if (minPrice === filters.minPrice && maxPrice === filters.maxPrice) {
      return;
    }

    const query = buildCatalogQuery(filters, {
      minPrice,
      maxPrice,
      page: 1,
    });
    router.push(
      query ? `/${locale}/products?${query}` : `/${locale}/products`,
    );
  }

  function commitMin(next: number): void {
    const clamped = clamp(next, absoluteMin, maxValue);
    setMinValue(clamped);
    setMinDraft(null);
    navigateToRange(clamped, maxValue);
  }

  function commitMax(next: number): void {
    const clamped = clamp(next, minValue, absoluteMax);
    setMaxValue(clamped);
    setMaxDraft(null);
    navigateToRange(minValue, clamped);
  }

  if (priceBounds == null) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
          {labels.price}
        </legend>
        <p className="text-sm text-gray-500">{labels.price}</p>
      </fieldset>
    );
  }

  return (
    <details open className="group rounded-2xl bg-[#F3F4F6] px-4 py-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold tracking-wide text-gray-900 uppercase">
          {labels.price}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className="size-3 rotate-180 text-gray-400 transition-transform group-open:rotate-0"
          fill="none"
        >
          <path
            d="M1 6.5 6 1.5l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div className="mt-4 space-y-4">
        <div className="relative h-5">
          <div
            aria-hidden="true"
            className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full"
            style={{
              background: `linear-gradient(to right, ${PRICE_RANGE_COLORS.trackIdle} 0%, ${PRICE_RANGE_COLORS.trackIdle} ${leftPercent}%, ${PRICE_RANGE_COLORS.accent} ${leftPercent}%, ${PRICE_RANGE_COLORS.accent} ${rightPercent}%, ${PRICE_RANGE_COLORS.trackIdle} ${rightPercent}%, ${PRICE_RANGE_COLORS.trackIdle} 100%)`,
            }}
          />
          <input
            id={`${baseId}-min`}
            type="range"
            min={absoluteMin}
            max={absoluteMax}
            step={1}
            value={minValue}
            aria-label={labels.minPrice}
            className={PRICE_RANGE_THUMB_CLASS}
            style={{ zIndex: activeThumb === "min" ? 30 : 20 }}
            onPointerDown={() => setActiveThumb("min")}
            onChange={(event) => {
              setMinValue(Math.min(Number(event.target.value), maxValue));
            }}
            onPointerUp={(event) => {
              const next = Math.min(
                Number(event.currentTarget.value),
                maxValue,
              );
              navigateToRange(next, maxValue);
            }}
            onKeyUp={(event) => {
              const next = Math.min(
                Number(event.currentTarget.value),
                maxValue,
              );
              navigateToRange(next, maxValue);
            }}
          />
          <input
            id={`${baseId}-max`}
            type="range"
            min={absoluteMin}
            max={absoluteMax}
            step={1}
            value={maxValue}
            aria-label={labels.maxPrice}
            className={PRICE_RANGE_THUMB_CLASS}
            style={{ zIndex: activeThumb === "max" ? 30 : 20 }}
            onPointerDown={() => setActiveThumb("max")}
            onChange={(event) => {
              setMaxValue(Math.max(Number(event.target.value), minValue));
            }}
            onPointerUp={(event) => {
              const next = Math.max(
                Number(event.currentTarget.value),
                minValue,
              );
              navigateToRange(minValue, next);
            }}
            onKeyUp={(event) => {
              const next = Math.max(
                Number(event.currentTarget.value),
                minValue,
              );
              navigateToRange(minValue, next);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{labels.minPrice}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={
                minDraft ?? formatPriceLabel(minValue, locale, currencySymbol)
              }
              onFocus={() => setMinDraft(String(minValue))}
              onChange={(event) => {
                const digits = digitsOnly(event.target.value);
                setMinDraft(digits);
                if (digits.length === 0) return;
                setMinValue(clamp(Number(digits), absoluteMin, maxValue));
              }}
              onBlur={() => {
                const parsed = parseAmountInput(minDraft ?? "");
                commitMin(parsed ?? absoluteMin);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const parsed = parseAmountInput(minDraft ?? "");
                  commitMin(parsed ?? absoluteMin);
                }
              }}
              className={VALUE_INPUT_CLASS}
            />
          </label>

          <span aria-hidden="true" className="h-px w-3 shrink-0 bg-gray-300" />

          <label className="min-w-0 flex-1">
            <span className="sr-only">{labels.maxPrice}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={
                maxDraft ?? formatPriceLabel(maxValue, locale, currencySymbol)
              }
              onFocus={() => setMaxDraft(String(maxValue))}
              onChange={(event) => {
                const digits = digitsOnly(event.target.value);
                setMaxDraft(digits);
                if (digits.length === 0) return;
                setMaxValue(clamp(Number(digits), minValue, absoluteMax));
              }}
              onBlur={() => {
                const parsed = parseAmountInput(maxDraft ?? "");
                commitMax(parsed ?? absoluteMax);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const parsed = parseAmountInput(maxDraft ?? "");
                  commitMax(parsed ?? absoluteMax);
                }
              }}
              className={VALUE_INPUT_CLASS}
            />
          </label>
        </div>
      </div>
    </details>
  );
}
