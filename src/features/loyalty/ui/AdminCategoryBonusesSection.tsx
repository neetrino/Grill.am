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
import { upsertCategoryBonusRuleAction } from "@/features/loyalty/application/manage-category-bonuses";
import type { CategoryBonusBoardRow } from "@/features/loyalty/application/product-bonus-board";
import { formatAppDateTimeLocalInput } from "@/lib/datetime/app-timezone";

type AdminCategoryBonusesSectionProps = {
  locale: string;
  categories: CategoryBonusBoardRow[];
};

type RowDraft = {
  amount: string;
  startsOn: string;
  endsOn: string;
};

function draftsFromCategories(
  categories: CategoryBonusBoardRow[],
): Record<string, RowDraft> {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      {
        amount:
          category.bonusAmount != null ? String(category.bonusAmount) : "",
        startsOn: category.startsAt
          ? formatAppDateTimeLocalInput(category.startsAt)
          : "",
        endsOn: category.endsAt
          ? formatAppDateTimeLocalInput(category.endsAt)
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

export function AdminCategoryBonusesSection({
  locale,
  categories,
}: AdminCategoryBonusesSectionProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.bonuses.categories;
  const common = dictionary.common;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() =>
    draftsFromCategories(categories),
  );
  const [syncedCategories, setSyncedCategories] = useState(categories);

  if (categories !== syncedCategories) {
    setSyncedCategories(categories);
    setDrafts(draftsFromCategories(categories));
  }

  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(needle) ||
        category.parentLabel.toLowerCase().includes(needle),
    );
  }, [categories, query]);

  function updateDraft(
    categoryId: string,
    patch: Partial<RowDraft>,
  ): void {
    setDrafts((prev) => ({
      ...prev,
      [categoryId]: {
        amount: prev[categoryId]?.amount ?? "",
        startsOn: prev[categoryId]?.startsOn ?? "",
        endsOn: prev[categoryId]?.endsOn ?? "",
        ...patch,
      },
    }));
  }

  function clearOne(categoryId: string, title: string): void {
    updateDraft(categoryId, { amount: "", startsOn: "", endsOn: "" });
    setSavingId(categoryId);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertCategoryBonusRuleAction(locale, {
        categoryId,
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

  function saveOne(categoryId: string, title: string): void {
    const draft = drafts[categoryId] ?? {
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

    setSavingId(categoryId);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertCategoryBonusRuleAction(locale, {
        categoryId,
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
        <label className="sr-only" htmlFor="category-bonus-search">
          {copy.searchAria}
        </label>
        <AdminSearchInput
          id="category-bonus-search"
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
          {filtered.map((category) => {
            const draft = drafts[category.id] ?? {
              amount: "",
              startsOn: "",
              endsOn: "",
            };
            const busy = isPending && savingId === category.id;
            const hasDraft =
              draft.amount.trim() !== "" ||
              draft.startsOn !== "" ||
              draft.endsOn !== "";

            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {category.imageUrl ? (
                    // Admin/R2 hosts vary — native img avoids brittle next/image allowlists.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.imageUrl}
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
                      {category.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.parentLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="sr-only"
                    htmlFor={`category-bonus-amount-${category.id}`}
                  >
                    {formatAdminMessage(copy.bonusFor, {
                      title: category.title,
                    })}
                  </label>
                  <div className="relative">
                    <input
                      id={`category-bonus-amount-${category.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      disabled={isPending}
                      placeholder={copy.amountPlaceholder}
                      value={draft.amount}
                      onChange={(event) =>
                        updateDraft(category.id, {
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
                      updateDraft(category.id, {
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
                    onClick={() => saveOne(category.id, category.title)}
                    className="border-0 bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 focus:ring-brand-yellow"
                  >
                    {busy ? common.saving : common.save}
                  </Button>
                  <button
                    type="button"
                    disabled={isPending || !hasDraft}
                    onClick={() => clearOne(category.id, category.title)}
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
