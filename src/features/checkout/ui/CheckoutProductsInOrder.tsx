"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { X } from "lucide-react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import {
  CHECKOUT_ORDER_ITEM_CARD_CLASS,
  CHECKOUT_ORDER_ITEMS_PREVIEW_CARD_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import { removeItem } from "@/features/cart/cart";
import {
  adjustLocalCartItemCount,
  notifyCartChanged,
} from "@/features/cart/cart-client-sync";

type CheckoutProductsInOrderProps = {
  products: CheckoutOrderProduct[];
  title: string;
  itemsOneLabel: string;
  itemsManyLabel: string;
  removeItemLabel: string;
  onCartChanged?: () => void;
};

function formatItemCount(
  count: number,
  itemsOneLabel: string,
  itemsManyLabel: string,
): string {
  if (count === 1) {
    return itemsOneLabel;
  }
  return itemsManyLabel.replace("{count}", String(count));
}

export function CheckoutProductsInOrder({
  products: initialProducts,
  title,
  itemsOneLabel,
  itemsManyLabel,
  removeItemLabel,
  onCartChanged,
}: CheckoutProductsInOrderProps) {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const [products, setProducts] = useState(initialProducts);
  // Tracks the `initialProducts` prop identity last synced into `products`.
  const [syncedInitialProducts, setSyncedInitialProducts] =
    useState(initialProducts);
  const [pending, startTransition] = useTransition();

  // Adjust state during render when the prop changes (React "adjusting
  // state on prop change" pattern) instead of a synchronous setState inside
  // an effect.
  if (initialProducts !== syncedInitialProducts) {
    setSyncedInitialProducts(initialProducts);
    setProducts(initialProducts);
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (list.scrollWidth <= list.clientWidth) {
        return;
      }
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      const nextLeft = list.scrollLeft + event.deltaY;
      const maxLeft = list.scrollWidth - list.clientWidth;
      const clamped = Math.min(maxLeft, Math.max(0, nextLeft));
      if (clamped === list.scrollLeft) {
        return;
      }

      event.preventDefault();
      list.scrollLeft = clamped;
    };

    list.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      list.removeEventListener("wheel", onWheel);
    };
  }, [products.length]);

  const itemCount = products.reduce((sum, product) => sum + product.quantity, 0);

  if (products.length === 0) {
    return null;
  }

  function onRemove(itemId: string): void {
    const removed = products.find((product) => product.id === itemId);
    const removedQty = removed?.quantity ?? 0;
    setProducts((current) => current.filter((product) => product.id !== itemId));
    adjustLocalCartItemCount(-removedQty);
    onCartChanged?.();

    startTransition(async () => {
      try {
        await removeItem(itemId);
        notifyCartChanged();
        router.refresh();
      } catch {
        if (removed) {
          setProducts((current) => [...current, removed]);
          adjustLocalCartItemCount(removedQty);
        }
      }
    });
  }

  return (
    <section
      className={CHECKOUT_ORDER_ITEMS_PREVIEW_CARD_CLASS}
      aria-label={title}
    >
      <div className="mb-0 flex items-start justify-between gap-4">
        <h2 className="text-sm font-bold tracking-wide text-gray-900 uppercase">
          {title}
        </h2>
        <p className="shrink-0 text-sm text-gray-500">
          {formatItemCount(itemCount, itemsOneLabel, itemsManyLabel)}
        </p>
      </div>

      <ul
        ref={listRef}
        className="flex gap-3 overflow-x-auto overscroll-x-contain pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li key={product.id} className={CHECKOUT_ORDER_ITEM_CARD_CLASS}>
            <div className="flex items-stretch gap-3">
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[16px] bg-white">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="line-clamp-2 text-sm font-medium text-gray-900"
                      title={[product.title, ...product.modifierLines].join(
                        " · ",
                      )}
                    >
                      {product.title}
                    </p>
                    {product.modifierLines.length > 0 ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                        {product.modifierLines.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    disabled={pending}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60"
                    aria-label={removeItemLabel}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-gray-200 bg-[#fff7ed] px-2 text-[11px] font-semibold text-gray-900">
                    ×{product.quantity}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
