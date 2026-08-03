"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import { CartEmptyState } from "@/features/cart/ui/CartEmptyState";
import { PRODUCT_CARD_IMAGE } from "@/features/products/ui/ProductCard";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type CatalogCartSidebarProps = {
  locale: Locale;
  currency: Currency;
  labels: Dictionary["cartDrawer"];
  initialItemCount: number;
};

export function CatalogCartSidebar({
  locale,
  currency,
  labels,
  initialItemCount,
}: CatalogCartSidebarProps) {
  const [view, setView] = useState<CartDrawerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const badgeCount = view?.itemCount ?? initialItemCount;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadCartDrawerViewAction(locale, currency).then((next) => {
      if (cancelled) return;
      setView(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, currency]);

  function changeQuantity(itemId: string, quantity: number): void {
    startTransition(async () => {
      await updateQuantity(itemId, quantity);
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
    });
  }

  function removeCartItem(itemId: string): void {
    startTransition(async () => {
      await removeItem(itemId);
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
    });
  }

  return (
    <aside className="flex h-full flex-col border-l border-[#f3f4f6] bg-white shadow-[-1px_0_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-5 pt-5 pb-[21px]">
        <ShoppingBasket className="size-[18px] text-[#101828]" aria-hidden />
        <h2 className="text-base leading-6 font-bold text-[#101828]">
          {labels.title}
        </h2>
        <span className="ml-auto inline-flex h-[25px] min-w-[30px] items-center justify-center rounded-full bg-brand-red px-2 text-sm font-bold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-5 ${
          pending || loading ? "opacity-70" : ""
        }`}
      >
        {loading && !view ? (
          <p className="py-8 text-sm text-[#4a5565]">{labels.loading}</p>
        ) : !view || view.items.length === 0 ? (
          <CartEmptyState
            title={labels.empty}
            catalogLabel={labels.browseCatalog}
            catalogHref={`/${locale}/products`}
          />
        ) : (
          <ul>
            {view.items.map((item, index) => (
              <li
                key={item.id}
                className={
                  index < view.items.length - 1
                    ? "border-b border-[#f3f4f6]"
                    : undefined
                }
              >
                <div className="flex items-center gap-3 py-3">
                  <AppLink
                    href={`/${locale}/products/${item.slug}`}
                    prefetchPolicy="intent"
                    className="relative size-12 shrink-0 overflow-hidden rounded-[14px] bg-brand-surface"
                  >
                    <Image
                      src={item.imageUrl ?? PRODUCT_CARD_IMAGE}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </AppLink>

                  <div className="min-w-0 flex-1">
                    <AppLink
                      href={`/${locale}/products/${item.slug}`}
                      prefetchPolicy="intent"
                      className="line-clamp-1 text-xs leading-[16.5px] font-semibold text-[#101828]"
                    >
                      {item.title}
                    </AppLink>
                    <p className="mt-0.5 text-xs font-bold text-brand-red">
                      {item.unitPriceFormatted}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={pending || item.quantity <= 1}
                      aria-label={labels.decreaseQuantity}
                      onClick={() =>
                        changeQuantity(item.id, item.quantity - 1)
                      }
                      className="inline-flex size-6 items-center justify-center rounded-full bg-[#f3f4f6] text-[#0a0a0a] transition hover:bg-[#e5e7eb] disabled:opacity-40"
                    >
                      <Minus className="size-2.5" aria-hidden />
                    </button>
                    <span className="w-4 text-center text-xs font-semibold text-[#0a0a0a]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={labels.increaseQuantity}
                      onClick={() =>
                        changeQuantity(item.id, item.quantity + 1)
                      }
                      className="inline-flex size-6 items-center justify-center rounded-full bg-brand-red text-white transition hover:bg-brand-red-hot disabled:opacity-40"
                    >
                      <Plus className="size-2.5" aria-hidden />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={pending}
                    aria-label={labels.removeItem}
                    onClick={() => removeCartItem(item.id)}
                    className="shrink-0 text-[#99a1af] transition hover:text-brand-red disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[#f3f4f6] px-5 pt-[21px] pb-8">
        <dl className="space-y-0 text-sm">
          <div className="flex items-center justify-between leading-5">
            <dt className="text-[#4a5565]">{labels.subtotal}</dt>
            <dd className="font-medium tabular-nums text-[#101828]">
              {view?.subtotalFormatted ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2.5 leading-5">
            <dt className="text-[#4a5565]">{labels.shipping}</dt>
            <dd className="font-medium tabular-nums text-[#101828]">
              {view?.shippingFormatted ?? "—"}
            </dd>
          </div>
          <div className="mt-2.5 border-t border-[#f3f4f6] pt-3.5">
            <div className="flex items-center justify-between leading-5">
              <dt className="font-bold text-[#101828]">{labels.total}</dt>
              <dd className="font-bold tabular-nums text-brand-red">
                {view?.totalFormatted ?? "—"}
              </dd>
            </div>
          </div>
        </dl>

        <AppLink
          href={`/${locale}/checkout`}
          prefetchPolicy="intent"
          className={`mt-4 flex h-12 w-full items-center justify-center rounded-[46px] bg-brand-red text-sm font-bold text-white transition hover:bg-brand-red-hot ${
            !view || view.items.length === 0
              ? "pointer-events-none opacity-40"
              : ""
          }`}
          aria-disabled={!view || view.items.length === 0}
        >
          {labels.pay}
        </AppLink>
      </div>
    </aside>
  );
}
