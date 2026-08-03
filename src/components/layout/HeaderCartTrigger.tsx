"use client";

import { ShoppingCart } from "lucide-react";

import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type HeaderCartTriggerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
};

export function HeaderCartTrigger({
  locale,
  currency,
  dictionary,
  itemCount,
}: HeaderCartTriggerProps) {
  return (
    <CartDrawer
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      itemCount={itemCount}
      renderTrigger={({
        open,
        badgeCount,
        totalFormatted,
        label,
        openDrawer,
        prefetchDrawerView,
      }) => (
        <button
          type="button"
          onClick={openDrawer}
          onPointerEnter={prefetchDrawerView}
          onFocus={prefetchDrawerView}
          aria-label={label}
          aria-expanded={open}
          className="inline-flex h-12 min-w-[114px] shrink-0 items-center justify-center gap-[11px] rounded-full bg-brand-red px-5 text-base leading-6 font-bold whitespace-nowrap text-white transition hover:bg-brand-red-hot"
        >
          <span className="relative inline-flex shrink-0">
            <ShoppingCart
              className="h-[21px] w-[22px] shrink-0 fill-white text-white"
              strokeWidth={1.2}
              aria-hidden
            />
            {badgeCount > 0 ? (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] leading-none font-bold text-[#131313]">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </span>
          <span className="tabular-nums">{totalFormatted}</span>
        </button>
      )}
    />
  );
}
