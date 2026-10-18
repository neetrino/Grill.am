"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DateRangeField } from "@/components/ui/DateRangeField";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import { AdminSearchInput } from "@/features/admin/ui/AdminSearchInput";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { upsertProductBonusRuleAction } from "@/features/loyalty/application/manage-product-bonuses";
import type { ProductBonusBoardRow } from "@/features/loyalty/application/product-bonus-board";
import { formatAppDateTimeLocalInput } from "@/lib/datetime/app-timezone";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminProductBonusesSectionProps = {
  locale: string;
  products: ProductBonusBoardRow[];
};

type RowDraft = {
  amount: string;
  startsOn: string;
  endsOn: string;
};

function draftsFromProducts(
  products: ProductBonusBoardRow[],
): Record<string, RowDraft> {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        amount: product.bonusAmount != null ? String(product.bonusAmount) : "",
        startsOn: product.startsAt
          ? formatAppDateTimeLocalInput(product.startsAt)
          : "",
        endsOn: product.endsAt
          ? formatAppDateTimeLocalInput(product.endsAt)
          : "",
      },
    ]),
  );
}

function parseAmount(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const next = Number(trimmed);
  if (!Number.isInteger(next) || next < 1 || next > 10_000_000) {
    return "invalid";
  }
  return next;
}

export function AdminProductBonusesSection({
  locale,
  products,
}: AdminProductBonusesSectionProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.bonuses.products;
  const common = dictionary.common;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() =>
    draftsFromProducts(products),
  );
  const [syncedProducts, setSyncedProducts] = useState(products);

  if (products !== syncedProducts) {
    setSyncedProducts(products);
    setDrafts(draftsFromProducts(products));
  }

  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(needle) ||
        product.slug.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle),
    );
  }, [products, query]);

  function updateDraft(
    productId: string,
    patch: Partial<RowDraft>,
  ): void {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        amount: prev[productId]?.amount ?? "",
        startsOn: prev[productId]?.startsOn ?? "",
        endsOn: prev[productId]?.endsOn ?? "",
        ...patch,
      },
    }));
  }

  function clearOne(productId: string, title: string): void {
    updateDraft(productId, { amount: "", startsOn: "", endsOn: "" });
    setSavingId(productId);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertProductBonusRuleAction(locale, {
        productId,
        amount: null,
        startsOn: null,
        endsOn: null,
      });
      setSavingId(null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessage(formatAdminMessage(copy.cleared, { title }));
      router.refresh();
    });
  }

  function saveOne(productId: string, title: string): void {
    const draft = drafts[productId] ?? {
      amount: "",
      startsOn: "",
      endsOn: "",
    };
    const parsed = parseAmount(draft.amount);
    if (parsed === "invalid") {
      setError(formatAdminMessage(copy.invalidAmount, { title }));
      return;
    }
    if (draft.startsOn && draft.endsOn && draft.startsOn > draft.endsOn) {
      setError(formatAdminMessage(copy.invalidRange, { title }));
      return;
    }

    setSavingId(productId);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertProductBonusRuleAction(locale, {
        productId,
        amount: parsed,
        startsOn: draft.startsOn || null,
        endsOn: draft.endsOn || null,
      });
      setSavingId(null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessage(
        parsed == null
          ? formatAdminMessage(copy.cleared, { title })
          : formatAdminMessage(copy.saved, {
              amount: String(parsed),
              title,
            }),
      );
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
        <p className="text-sm text-gray-500">{copy.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="product-bonus-search">
          {copy.searchAria}
        </label>
        <AdminSearchInput
          id="product-bonus-search"
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            {copy.clearSearch}
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
          {copy.empty}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((product) => {
            const draft = drafts[product.id] ?? {
              amount: "",
              startsOn: "",
              endsOn: "",
            };
            const busy = isPending && savingId === product.id;
            const hasDraft =
              draft.amount.trim() !== "" ||
              draft.startsOn !== "" ||
              draft.endsOn !== "";

            return (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {product.imageUrl ? (
                    // Admin/R2 hosts vary — native img avoids brittle next/image allowlists.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span
                      className="h-12 w-12 shrink-0 rounded-md bg-gray-100"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatMoneyAmount(product.priceAmount, "AMD", locale)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="sr-only"
                    htmlFor={`product-bonus-amount-${product.id}`}
                  >
                    {formatAdminMessage(copy.bonusFor, {
                      title: product.title,
                    })}
                  </label>
                  <div className="relative">
                    <input
                      id={`product-bonus-amount-${product.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      disabled={isPending}
                      placeholder={copy.amountPlaceholder}
                      value={draft.amount}
                      onChange={(event) =>
                        updateDraft(product.id, {
                          amount: event.target.value,
                        })
                      }
                      className={`${ADMIN_INPUT} w-24 pr-10`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                      ֏
                    </span>
                  </div>

                  <DateRangeField
                    label={copy.periodLabel}
                    hideLabel
                    value={{
                      startsAt: draft.startsOn,
                      endsAt: draft.endsOn,
                    }}
                    onChange={(next) =>
                      updateDraft(product.id, {
                        startsOn: next.startsAt,
                        endsOn: next.endsAt,
                      })
                    }
                    disabled={isPending}
                    className="w-[16rem] sm:w-[18rem]"
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => saveOne(product.id, product.title)}
                    className="border-0 bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 focus:ring-brand-yellow"
                  >
                    {busy ? common.saving : common.save}
                  </Button>
                  <button
                    type="button"
                    disabled={isPending || !hasDraft}
                    onClick={() => clearOne(product.id, product.title)}
                    className="px-2 text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-40"
                  >
                    {copy.clearRow}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
    </section>
  );
}
