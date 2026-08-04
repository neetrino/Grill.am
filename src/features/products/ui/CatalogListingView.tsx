"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

import type { CatalogFilter } from "@/features/products/schemas/catalog-list";
import { CatalogSortBar } from "@/features/products/ui/CatalogSortBar";

export type CatalogGridColumns = 3 | 4;

const STORAGE_KEY = "grill.catalog.gridCols";

type CatalogListingViewProps = {
  locale: string;
  filters: CatalogFilter;
  sortLabels: {
    popular: string;
    newest: string;
    onSale: string;
  };
  viewLabels: {
    group: string;
    three: string;
    four: string;
  };
  chips: ReactNode;
  empty: ReactNode | null;
  children: ReactNode;
};

function readStoredColumns(): CatalogGridColumns {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "4" ? 4 : 3;
  } catch {
    return 3;
  }
}

function DotGridIcon({ size }: { size: 3 | 4 }) {
  const view = 18;
  const pad = size === 3 ? 2.5 : 2;
  const radius = size === 3 ? 1.55 : 1.15;
  const step = (view - pad * 2) / (size - 1);

  return (
    <svg
      viewBox={`0 0 ${view} ${view}`}
      className="size-[18px]"
      fill="currentColor"
      aria-hidden
    >
      {Array.from({ length: size * size }, (_, index) => {
        const col = index % size;
        const row = Math.floor(index / size);
        return (
          <circle
            key={`${row}-${col}`}
            cx={pad + col * step}
            cy={pad + row * step}
            r={radius}
          />
        );
      })}
    </svg>
  );
}

/** Sort tabs + 3/4-column view toggle, and the product grid shell. */
export function CatalogListingView({
  locale,
  filters,
  sortLabels,
  viewLabels,
  chips,
  empty,
  children,
}: CatalogListingViewProps) {
  const [columns, setColumns] = useState<CatalogGridColumns>(3);

  useLayoutEffect(() => {
    setColumns(readStoredColumns());
  }, []);

  function selectColumns(next: CatalogGridColumns): void {
    setColumns(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  const gridClass =
    columns === 3
      ? "mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3"
      : "mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4";

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <CatalogSortBar
          locale={locale}
          filters={filters}
          labels={sortLabels}
        />

        <div
          role="group"
          aria-label={viewLabels.group}
          className="relative ml-auto hidden items-center gap-1 rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:inline-flex"
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1 left-1 size-8 rounded-full bg-brand-red transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              columns === 4 ? "translate-x-9" : "translate-x-0"
            }`}
          />
          <button
            type="button"
            aria-label={viewLabels.three}
            aria-pressed={columns === 3}
            onClick={() => selectColumns(3)}
            className={`relative z-10 inline-flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none ${
              columns === 3
                ? "text-white"
                : "text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            <DotGridIcon size={3} />
          </button>
          <button
            type="button"
            aria-label={viewLabels.four}
            aria-pressed={columns === 4}
            onClick={() => selectColumns(4)}
            className={`relative z-10 inline-flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none ${
              columns === 4
                ? "text-white"
                : "text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            <DotGridIcon size={4} />
          </button>
        </div>
      </div>

      <div className="mt-4">{chips}</div>

      {empty ?? <div className={gridClass}>{children}</div>}
    </>
  );
}
