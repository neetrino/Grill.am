"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { CartDrawerItemView } from "@/features/cart/get-cart-drawer-view";
import { PRODUCT_CARD_IMAGE } from "@/features/products/ui/ProductCard";

type CartDrawerItemRowProps = {
  item: CartDrawerItemView;
  productHref: string;
  pending: boolean;
  removeLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  onRemove: (itemId: string) => void;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onNavigate?: () => void;
};

const THUMB_SIZE_PX = 96;

export function CartDrawerItemRow({
  item,
  productHref,
  pending,
  removeLabel,
  decreaseLabel,
  increaseLabel,
  onRemove,
  onChangeQuantity,
  onNavigate,
}: CartDrawerItemRowProps) {
  const imageSrc = item.imageUrl ?? PRODUCT_CARD_IMAGE;

  return (
    <article className="rounded-[20px] border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-stretch gap-3">
        <AppLink
          href={productHref}
          prefetchPolicy="intent"
          onClick={onNavigate}
          className="relative block shrink-0 self-stretch overflow-hidden rounded-2xl bg-brand-surface"
          style={{ width: THUMB_SIZE_PX, minHeight: THUMB_SIZE_PX }}
        >
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            sizes={`${THUMB_SIZE_PX}px`}
            className="object-cover"
          />
        </AppLink>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <AppLink
                href={productHref}
                prefetchPolicy="intent"
                onClick={onNavigate}
                className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-gray-600"
              >
                {item.title}
              </AppLink>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {item.unitPriceFormatted}
              </p>
              {item.modifierLines.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.modifierLines.map((line) => (
                    <li
                      key={line}
                      className="inline-flex h-7 max-w-full items-center truncate rounded-full bg-brand-red px-2.5 text-xs font-semibold text-white"
                      title={line}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label={removeLabel}
              disabled={pending}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex justify-end">
            <div className="inline-flex shrink-0 items-center rounded-full border border-gray-200 bg-gray-50 px-0.5 py-0.5">
              <button
                type="button"
                onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white"
                aria-label={decreaseLabel}
                disabled={pending}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-semibold tabular-nums text-gray-900">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white"
                aria-label={increaseLabel}
                disabled={pending}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
