import { ChevronRight } from "lucide-react";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import { AppLink } from "@/components/ui/AppLink";
import type { Locale } from "@/lib/i18n/config";

type HeaderCoinsPillProps = {
  locale: Locale;
  balanceAmount: number;
  coinsLabel: string;
  ariaLabel: string;
  /** Where the pill navigates (bonuses for signed-in, login for guests). */
  href: string;
  /** Compact control for tight mobile chrome; default matches header search height. */
  size?: "md" | "sm";
};

function formatCoinsBalance(amount: number, locale: Locale): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU");
}

/**
 * Cream bonuses pill — links to profile coins history (or login when guest).
 * Default height matches HeaderSearch (`h-12` / `sm:h-[49px]`).
 */
export function HeaderCoinsPill({
  locale,
  balanceAmount,
  coinsLabel,
  ariaLabel,
  href,
  size = "md",
}: HeaderCoinsPillProps) {
  const compact = size === "sm";

  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center rounded-full bg-[#FFF4D4] text-left transition hover:bg-[#FFEDC2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${
        compact
          ? "h-9 gap-1.5 py-0 pr-2 pl-1"
          : "h-12 gap-2.5 py-0 pr-3.5 pl-2 sm:h-[49px] sm:pr-4 sm:pl-2.5"
      }`}
    >
      <HeaderCoinsIcon
        className={compact ? "size-7 shrink-0" : "size-8 shrink-0 sm:size-9"}
      />
      <span className="min-w-0 leading-tight">
        <span
          className={`block font-bold text-[#3D2E1F] tabular-nums ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {formatCoinsBalance(balanceAmount, locale)}
        </span>
        <span
          className={`block font-medium text-[#8A735A] ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          {coinsLabel}
        </span>
      </span>
      <ChevronRight
        className={`shrink-0 text-[#B0A090] ${compact ? "size-3.5" : "size-4"}`}
        strokeWidth={2}
        aria-hidden
      />
    </AppLink>
  );
}
