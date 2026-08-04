"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { Search, X } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import {
  searchHeaderProductsAction,
  type HeaderSearchHit,
} from "@/features/products/application/search-header-products";
import { normalizeHeaderSearchQuery } from "@/features/products/domain/header-search-query";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type HeaderSearchLabels = {
  search: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchViewAll: string;
  searchHint: string;
  close: string;
};

type HeaderSearchProps = {
  locale: Locale;
  currency: Currency;
  labels: HeaderSearchLabels;
  className?: string;
};

const DEBOUNCE_MS = 250;

export function HeaderSearch({
  locale,
  currency,
  labels,
  className,
}: HeaderSearchProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<HeaderSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const normalized = normalizeHeaderSearchQuery(query);
    if (!normalized) {
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      startTransition(async () => {
        const result = await searchHeaderProductsAction(
          locale,
          currency,
          normalized,
        );
        if (requestId !== requestIdRef.current) return;

        if (!result.ok) {
          setHits([]);
          setSearched(true);
          setError(result.error.message);
          return;
        }

        setError(null);
        setHits(result.value);
        setSearched(true);
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, locale, currency]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node)) return;
      if (!root.contains(event.target)) {
        setPanelOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setPanelOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function clearSearch(): void {
    requestIdRef.current += 1;
    setQuery("");
    setHits([]);
    setSearched(false);
    setError(null);
    inputRef.current?.focus();
  }

  function handleQueryChange(value: string): void {
    setQuery(value);
    setPanelOpen(true);
    if (!normalizeHeaderSearchQuery(value)) {
      requestIdRef.current += 1;
      setHits([]);
      setSearched(false);
      setError(null);
    }
  }

  function closePanel(): void {
    setPanelOpen(false);
  }

  const normalizedQuery = normalizeHeaderSearchQuery(query);
  const viewAllHref = `/${locale}/products?q=${encodeURIComponent(normalizedQuery)}`;
  const visibleHits = normalizedQuery ? hits : [];
  const showEmpty =
    Boolean(normalizedQuery) &&
    searched &&
    !isPending &&
    !error &&
    visibleHits.length === 0;
  const showPanel = panelOpen;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <label className="flex h-12 w-full items-center gap-3 rounded-full bg-brand-surface px-4 text-sm text-[rgba(33,43,54,0.46)] transition focus-within:bg-[#ececec] sm:h-[49px] sm:gap-2 sm:px-8">
        <Search className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
        <span className="sr-only">{labels.search}</span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setPanelOpen(true)}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showPanel}
          className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-[rgba(33,43,54,0.46)] sm:text-sm"
          // Chrome iOS injects __gcruniqueid before hydration.
          suppressHydrationWarning
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-lg p-1 text-gray-500 hover:bg-black/5 hover:text-gray-900"
            aria-label={labels.close}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={labels.search}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[60] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
            {!normalizedQuery ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                {labels.searchHint}
              </p>
            ) : null}

            {error ? (
              <p className="px-4 py-6 text-center text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {showEmpty ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                {labels.searchNoResults}
              </p>
            ) : null}

            {visibleHits.length > 0 ? (
              <ul className="divide-y divide-gray-100 py-1">
                {visibleHits.map((hit) => (
                  <li key={hit.id} role="option" aria-selected={false}>
                    <AppLink
                      href={hit.href}
                      prefetchPolicy="intent"
                      onClick={closePanel}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                        hit.inStock ? "" : "opacity-60"
                      }`}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {hit.imageUrl ? (
                          <Image
                            src={hit.imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {hit.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                          {hit.priceFormatted}
                        </p>
                      </div>
                    </AppLink>
                  </li>
                ))}
              </ul>
            ) : null}

            {isPending && normalizedQuery ? (
              <p className="px-4 py-3 text-center text-xs text-gray-400">…</p>
            ) : null}
          </div>

          {normalizedQuery ? (
            <div className="border-t border-gray-200 px-4 py-3">
              <AppLink
                href={viewAllHref}
                prefetchPolicy="intent"
                onClick={closePanel}
                className="block text-center text-sm font-medium text-gray-900 hover:underline"
              >
                {labels.searchViewAll}
              </AppLink>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
