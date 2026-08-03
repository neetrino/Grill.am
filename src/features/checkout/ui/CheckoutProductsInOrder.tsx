"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import {
  CHECKOUT_ORDER_ITEM_CARD_CLASS,
  CHECKOUT_ORDER_ITEMS_PREVIEW_CARD_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import { removeItem } from "@/features/cart/cart";
import { PRODUCT_CARD_IMAGE } from "@/features/products/ui/ProductCard";

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
  const [products, setProducts] = useState(initialProducts);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const itemCount = products.reduce((sum, product) => sum + product.quantity, 0);

  if (products.length === 0) {
    return null;
  }

  function onRemove(itemId: string): void {
    setProducts((current) => current.filter((product) => product.id !== itemId));
    onCartChanged?.();

    startTransition(async () => {
      await removeItem(itemId);
      router.refresh();
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

      <ul className="flex gap-3 overflow-x-auto overscroll-x-contain pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className={CHECKOUT_ORDER_ITEM_CARD_CLASS}>
            <div className="flex items-stretch gap-3">
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[16px] bg-brand-surface">
                <Image
                  src={product.imageUrl ?? PRODUCT_CARD_IMAGE}
                  alt={product.title}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
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
