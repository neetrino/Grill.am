"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { ShoppingCart } from "lucide-react";

import { DrawerCloseTab } from "@/components/drawer/DrawerCloseTab";
import { AppLink } from "@/components/ui/AppLink";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import { CartDrawerItemRow } from "@/features/cart/ui/CartDrawerItemRow";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type CartDrawerTriggerArgs = {
  open: boolean;
  badgeCount: number;
  totalFormatted: string;
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
  const totalFormatted = view?.totalFormatted ?? "0.00";

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
              className={`relative h-dvh max-h-dvh w-[87%] max-w-md transition-transform duration-300 ease-out motion-reduce:transition-none sm:w-full ${
                entered ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <DrawerCloseTab onClose={closeDrawer} closeLabel={labels.close} />
              <div
                className="relative z-[2] flex h-full w-full flex-col overflow-hidden rounded-tl-3xl rounded-bl-3xl bg-white shadow-2xl"
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
              </div>

              <div
                className={`flex-1 overflow-y-auto px-6 py-4 ${pending || loadingView ? "opacity-70" : ""}`}
              >
                {loadingView && !view ? (
                  <p className="py-10 text-sm text-gray-500">{labels.loading}</p>
                ) : !view || view.items.length === 0 ? (
                  <p className="py-10 text-sm text-gray-500">{labels.empty}</p>
                ) : (
                  <ul className="space-y-3">
                    {view.items.map((item) => (
                      <li key={item.id}>
                        <CartDrawerItemRow
                          item={item}
                          productHref={`/${locale}/products/${item.slug}`}
                          pending={pending}
                          removeLabel={labels.removeItem}
                          decreaseLabel={labels.decreaseQuantity}
                          increaseLabel={labels.increaseQuantity}
                          onRemove={removeCartItem}
                          onChangeQuantity={changeQuantity}
                          onNavigate={closeDrawer}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <dl className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-3">
                    <dt>{labels.subtotal}</dt>
                    <dd className="font-medium tabular-nums text-gray-900">
                      {view?.subtotalFormatted ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>{labels.shipping}</dt>
                    <dd className="font-medium tabular-nums text-gray-900">
                      {view?.shippingFormatted ?? "—"}
                    </dd>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-base font-bold text-gray-900">
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
                    className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    onClick={closeDrawer}
                  >
                    {labels.checkout}
                  </AppLink>
                ) : null}
              </div>
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
          totalFormatted,
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
