"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import { removeItem } from "@/features/cart/cart";

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
      className="mb-8 rounded-3xl bg-[#eef3f8] px-5 py-5 sm:px-6"
      aria-label={title}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="text-sm font-bold tracking-wide text-gray-900 uppercase">
          {title}
        </h2>
        <p className="shrink-0 text-sm text-gray-800">
          {formatItemCount(itemCount, itemsOneLabel, itemsManyLabel)}
        </p>
      </div>

      <ul className="flex flex-wrap gap-4">
        {products.map((product) => (
          <li key={product.id} className="w-24 sm:w-28">
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    —
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(product.id)}
                disabled={pending}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:text-gray-900 disabled:opacity-60"
                aria-label={removeItemLabel}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 truncate text-sm text-gray-900" title={product.title}>
              {product.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
