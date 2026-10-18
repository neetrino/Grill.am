"use client";

import { useEffect, useState } from "react";

import { HeaderCoinsPill } from "@/components/layout/HeaderCoinsPill";
import {
  getHeaderCoinsStateAction,
  type HeaderCoinsStateDto,
} from "@/features/loyalty/application/get-header-coins-state";
import type { Locale } from "@/lib/i18n/config";

type HeaderCoinsClientIslandProps = {
  locale: Locale;
  coinsLabel: string;
  ariaLabel: string;
};

const GUEST: HeaderCoinsStateDto = {
  isSignedIn: false,
  balanceAmount: 0,
};

/**
 * Cookie-free coins pill for ISR routes. Balance loads after hydration so
 * the static PDP/catalog HTML never calls `cookies()`.
 */
export function HeaderCoinsClientIsland({
  locale,
  coinsLabel,
  ariaLabel,
}: HeaderCoinsClientIslandProps) {
  const [state, setState] = useState<HeaderCoinsStateDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getHeaderCoinsStateAction()
      .then((next) => {
        if (!cancelled) {
          setState(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(GUEST);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) {
    return (
      <div
        className="h-12 w-[6.5rem] animate-pulse rounded-full bg-brand-surface sm:h-[49px]"
        aria-hidden
      />
    );
  }

  return (
    <HeaderCoinsPill
      locale={locale}
      balanceAmount={state.balanceAmount}
      coinsLabel={coinsLabel}
      ariaLabel={ariaLabel}
      href={
        state.isSignedIn
          ? `/${locale}/profile/bonuses`
          : `/${locale}/login`
      }
    />
  );
}
