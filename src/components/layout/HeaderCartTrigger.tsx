"use client";

import { ShoppingBag } from "lucide-react";

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
          className="inline-flex h-12 min-w-[114px] items-center justify-center gap-2.5 rounded-full bg-brand-red px-5 text-base font-bold text-white transition hover:bg-brand-red-hot"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden />
          <span>{badgeCount > 0 ? badgeCount : "0.00"}</span>
        </button>
      )}
    />
  );
}
