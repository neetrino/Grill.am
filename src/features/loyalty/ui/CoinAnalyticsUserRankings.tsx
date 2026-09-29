"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminSearchInput } from "@/features/admin/ui/AdminSearchInput";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
} from "@/features/admin/ui/admin-ui";
import type { CoinAnalyticsTopUser } from "@/features/loyalty/application/coin-analytics-queries";
import { formatCoinAmount } from "@/features/loyalty/domain/coin-analytics";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const SEARCH_DEBOUNCE_MS = 300;

type CoinAnalyticsUserRankingsProps = {
  locale: string;
  users: CoinAnalyticsTopUser[];
  outstandingBalance: number;
  from: string;
  to: string;
  query: string;
};

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "yellow" | "ink";
}) {
  const toneClass =
    tone === "red"
      ? "bg-brand-red/10 ring-brand-red/15"
      : tone === "yellow"
        ? "bg-brand-yellow/20 ring-brand-yellow/35"
        : "bg-brand-ink/5 ring-gray-200";

  return (
    <div className={`min-w-0 rounded-lg px-2 py-1.5 ring-1 ${toneClass}`}>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function CoinAnalyticsUserRankings({
  locale,
  users,
  outstandingBalance,
  from,
  to,
  query,
}: CoinAnalyticsUserRankingsProps) {
  const copy = useAdminDictionary().coinAnalytics.rankings;
  const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const router = useRouter();
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const next = draft.trim().slice(0, 80);
    if (next === query) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({ from, to });
      if (next) {
        params.set("q", next);
      }
      router.replace(
        `/${locale}/admin/coin-analytics?${params.toString()}`,
        { scroll: false },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [draft, from, locale, query, router, to]);

  return (
    <div className={`mb-3 ${ADMIN_CARD_CLASS} p-4`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            {copy.usersTitle}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">{copy.usersSubtitle}</p>
        </div>
        <div className="rounded-[12px] bg-brand-yellow/20 px-3 py-2 ring-1 ring-brand-yellow/35">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {copy.totalInWallets}
          </p>
          <p className="text-xl font-bold leading-none text-gray-900">
            {formatCoinAmount(outstandingBalance, resolvedLocale)}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <AdminSearchInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchAria}
          className="min-w-[220px]"
          autoComplete="off"
        />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-[12px] bg-brand-surface/60 p-2 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        <p>{copy.hasAmount}</p>
        <p>{copy.spentLifetime}</p>
        <p>{copy.combinedAmount}</p>
      </div>

      <div className="space-y-2">
        {users.map((row, index) => (
          <Link
            key={row.userId}
            href={`/${resolvedLocale}/admin/users/${row.userId}`}
            className={`block rounded-[12px] px-2.5 py-2.5 ring-1 ring-gray-100/80 ${ADMIN_CARD_HOVER_CLASS}`}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink/5 text-[11px] font-bold text-brand-ink">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {row.firstName} {row.lastName}
                </p>
                <p className="truncate text-[11px] text-gray-500">{row.email}</p>
                {row.phone ? (
                  <p className="truncate text-[11px] text-gray-500">
                    {row.phone}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <StatChip
                label={copy.hasAmount}
                value={formatCoinAmount(row.balanceAmount, resolvedLocale)}
                tone="yellow"
              />
              <StatChip
                label={copy.spentLifetime}
                value={formatCoinAmount(row.spentAmount, resolvedLocale)}
                tone="red"
              />
              <StatChip
                label={copy.combinedAmount}
                value={formatCoinAmount(row.combinedAmount, resolvedLocale)}
                tone="ink"
              />
            </div>
          </Link>
        ))}
        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-600">
            {query ? copy.noSearchResults : copy.noBalances}
          </p>
        ) : null}
      </div>
    </div>
  );
}
