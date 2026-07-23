"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type CartDrawerTriggerArgs = {
  open: boolean;
  badgeCount: number;
  label: string;
  openDrawer: () => void;
  prefetchDrawerView: () => void;
};

type CartDrawerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  /** Custom trigger (e.g. mobile bottom nav). Defaults to header cart button. */
  renderTrigger?: (args: CartDrawerTriggerArgs) => React.ReactNode;
};

const CLOSE_ANIMATION_MS = 220;

function formatItemCount(
  count: number,
  labels: Dictionary["cartDrawer"],
): string {
  if (count === 1) {
    return labels.itemsOne;
  }
  return labels.itemsMany.replace("{count}", String(count));
}

function subscribeNoop(): () => void {
  return () => undefined;
}

export function CartDrawer({
  locale,
  currency,
  dictionary,
  itemCount,
  renderTrigger,
}: CartDrawerProps) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<CartDrawerView | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [pending, startTransition] = useTransition();
  const labels = dictionary.cartDrawer;
  const badgeCount = view?.itemCount ?? itemCount;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function prefetchDrawerView(): void {
    if (view || loadingView || open) {
      return;
    }
    setLoadingView(true);
    startTransition(async () => {
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
      setLoadingView(false);
    });
  }

  function openDrawer(): void {
    setOpen(true);
    setVisible(true);
    setEntered(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
      });
    });
    if (!view) {
      setLoadingView(true);
      startTransition(async () => {
        const next = await loadCartDrawerViewAction(locale, currency);
        setView(next);
        setLoadingView(false);
      });
    }
  }

  function closeDrawer(): void {
    setOpen(false);
    setEntered(false);
    window.setTimeout(() => {
      setVisible(false);
    }, CLOSE_ANIMATION_MS);
  }

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

  const panel =
    mounted && visible
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
          >
            <button
              type="button"
              className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out ${
                entered ? "opacity-100" : "opacity-0"
              }`}
              aria-label={labels.close}
              onClick={closeDrawer}
            />
            <div
              className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${
                entered ? "translate-x-0" : "translate-x-full"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                    {labels.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {loadingView && !view
                      ? labels.loading
                      : formatItemCount(badgeCount, labels)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                  aria-label={labels.close}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div
                className={`flex-1 overflow-y-auto px-6 ${pending || loadingView ? "opacity-70" : ""}`}
              >
                {loadingView && !view ? (
                  <p className="py-10 text-sm text-gray-500">{labels.loading}</p>
                ) : !view || view.items.length === 0 ? (
                  <p className="py-10 text-sm text-gray-500">{labels.empty}</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {view.items.map((item) => (
                      <li key={item.id} className="flex gap-4 py-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              —
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base text-gray-900">
                                {item.title}
                              </p>
                              {item.modifierLines.length > 0 ? (
                                <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                                  {item.modifierLines.map((line) => (
                                    <li key={line} className="truncate">
                                      {line}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <p className="mt-1 text-base font-semibold text-gray-900">
                                {item.unitPriceFormatted}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.id)}
                              className="shrink-0 text-gray-400 transition-colors hover:text-gray-700"
                              aria-label={labels.removeItem}
                              disabled={pending}
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="mt-auto flex justify-end pt-3">
                            <div className="inline-flex items-center gap-3 rounded-xl bg-gray-900 px-3 py-1.5 text-white">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(item.id, item.quantity - 1)
                                }
                                className="flex h-6 w-6 items-center justify-center text-white/90 transition-opacity hover:opacity-80"
                                aria-label={labels.decreaseQuantity}
                                disabled={pending}
                              >
                                <Minus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                              <span className="min-w-4 text-center text-sm font-medium tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(item.id, item.quantity + 1)
                                }
                                className="flex h-6 w-6 items-center justify-center text-white/90 transition-opacity hover:opacity-80"
                                aria-label={labels.increaseQuantity}
                                disabled={pending}
                              >
                                <Plus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 pt-5 pb-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <dt>{labels.subtotal}</dt>
                    <dd className="tabular-nums text-gray-900">
                      {view?.subtotalFormatted ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <dt>{labels.shipping}</dt>
                    <dd className="tabular-nums text-gray-900">
                      {view?.shippingFormatted ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-base font-semibold text-gray-900">
                    <dt>{labels.total}</dt>
                    <dd className="tabular-nums">
                      {view?.totalFormatted ?? "—"}
                    </dd>
                  </div>
                </dl>

                {view && view.items.length > 0 ? (
                  <AppLink
                    href={`/${locale}/checkout`}
                    prefetchPolicy="intent"
                    className="mt-5 flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-3.5 text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-black"
                    onClick={closeDrawer}
                  >
                    {labels.checkout}
                  </AppLink>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {renderTrigger ? (
        renderTrigger({
          open,
          badgeCount,
          label: dictionary.nav.cart,
          openDrawer,
          prefetchDrawerView,
        })
      ) : (
        <button
          type="button"
          onClick={openDrawer}
          onPointerEnter={prefetchDrawerView}
          onFocus={prefetchDrawerView}
          className="inline-flex h-11 items-center gap-1 rounded-lg px-1 text-gray-700 transition-colors hover:text-gray-900"
          aria-label={dictionary.nav.cart}
          aria-expanded={open}
        >
          <span className="relative inline-flex h-11 w-11 items-center justify-center">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {badgeCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </span>
        </button>
      )}
      {panel}
    </>
  );
}
