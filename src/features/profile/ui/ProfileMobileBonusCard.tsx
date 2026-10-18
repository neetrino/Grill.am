"use client";

import { ChevronRight } from "lucide-react";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import { AppLink } from "@/components/ui/AppLink";
import { PROFILE_CARD_CLASS } from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";

type ProfileMobileBonusCardProps = {
  locale: Locale;
  label: string;
  balanceAmount: number;
  /** Opens the bonuses sheet when provided; otherwise links to the page. */
  onOpenSheet?: () => void;
};

function formatBonusBalance(amount: number, locale: Locale): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU");
}

/**
 * Kamancha-style mobile profile bonuses row — coin + balance + chevron.
 */
export function ProfileMobileBonusCard({
  locale,
  label,
  balanceAmount,
  onOpenSheet,
}: ProfileMobileBonusCardProps) {
  const className = `flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors active:bg-gray-50 hover:bg-gray-50/80 ${PROFILE_CARD_CLASS}`;
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative size-9 shrink-0">
          <HeaderCoinsIcon className="pointer-events-none absolute top-1/2 left-1/2 size-10 max-w-none -translate-x-1/2 -translate-y-1/2" />
        </span>
        <span className="truncate text-base font-bold text-gray-900">
          {label}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-lg font-bold tabular-nums text-brand-red">
          {formatBonusBalance(balanceAmount, locale)}
        </span>
        <ChevronRight
          className="h-[18px] w-[18px] text-brand-yellow"
          aria-hidden
        />
      </span>
    </>
  );

  if (onOpenSheet) {
    return (
      <button type="button" onClick={onOpenSheet} className={className}>
        {content}
      </button>
    );
  }

  return (
    <AppLink
      href={`/${locale}/profile/bonuses`}
      prefetchPolicy="intent"
      className={className}
    >
      {content}
    </AppLink>
  );
}
