"use client";

import { HeaderCoinsPill } from "@/components/layout/HeaderCoinsPill";
import { signedInCoinsHref } from "@/features/profile/ui/profile-sheet";
import { useDesktopChrome } from "@/features/profile/ui/use-desktop-chrome";
import type { Locale } from "@/lib/i18n/config";

type HeaderSignedInCoinsPillProps = {
  locale: Locale;
  balanceAmount: number;
  coinsLabel: string;
  ariaLabel: string;
  size?: "md" | "sm";
};

/** Logged-in coins: mobile sheet on the profile hub, desktop bonuses page. */
export function HeaderSignedInCoinsPill({
  locale,
  balanceAmount,
  coinsLabel,
  ariaLabel,
  size,
}: HeaderSignedInCoinsPillProps) {
  const isDesktop = useDesktopChrome();

  return (
    <HeaderCoinsPill
      locale={locale}
      balanceAmount={balanceAmount}
      coinsLabel={coinsLabel}
      ariaLabel={ariaLabel}
      href={signedInCoinsHref(locale, isDesktop)}
      size={size}
    />
  );
}
