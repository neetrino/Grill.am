"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
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
  triggerClassName?: string;
  showLabel?: boolean;
};

const DEBOUNCE_MS = 250;

function subscribeNoop(): () => void {
  return () => undefined;
}

export function HeaderSearch({
  locale,
  currency,
  labels,
  triggerClassName,
  showLabel = false,
}: HeaderSearchProps) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<HeaderSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

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
  }, [open, query, locale, currency]);

  function openSearch(): void {
    setOpen(true);
  }

  function closeSearch(): void {
    setOpen(false);
    setQuery("");
    setHits([]);
    setSearched(false);
    setError(null);
  }

  function handleQueryChange(value: string): void {
    setQuery(value);
    if (!normalizeHeaderSearchQuery(value)) {
      requestIdRef.current += 1;
      setHits([]);
      setSearched(false);
      setError(null);
    }
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

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label={labels.search}
        className={
          triggerClassName ??
          "relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors duration-150 hover:text-gray-900"
        }
      >
        <Search className="h-6 w-6 shrink-0" aria-hidden="true" />
        {showLabel ? <span>{labels.search}</span> : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[210] flex items-start justify-center bg-black/40 px-4 pt-[12vh] sm:pt-[16vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={closeSearch}
            >
              <div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
                  <Search
                    className="h-5 w-5 shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <h2 id={titleId} className="sr-only">
                    {labels.search}
                  </h2>
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    placeholder={labels.searchPlaceholder}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    aria-label={labels.close}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
                  {!normalizedQuery ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                      {labels.searchHint}
                    </p>
                  ) : null}

                  {error ? (
                    <p className="px-4 py-8 text-center text-sm text-red-700">
                      {error}
                    </p>
                  ) : null}

                  {showEmpty ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                      {labels.searchNoResults}
                    </p>
                  ) : null}

                  {visibleHits.length > 0 ? (
                    <ul className="divide-y divide-gray-100 py-1">
                      {visibleHits.map((hit) => (
                        <li key={hit.id}>
                          <AppLink
                            href={hit.href}
                            prefetchPolicy="intent"
                            onClick={closeSearch}
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
                    <p className="px-4 py-3 text-center text-xs text-gray-400">
                      …
                    </p>
                  ) : null}
                </div>

                {normalizedQuery ? (
                  <div className="border-t border-gray-200 px-4 py-3">
                    <AppLink
                      href={viewAllHref}
                      prefetchPolicy="intent"
                      onClick={closeSearch}
                      className="block text-center text-sm font-medium text-gray-900 hover:underline"
                    >
                      {labels.searchViewAll}
                    </AppLink>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
