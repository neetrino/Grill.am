"use client";

import type { MouseEvent } from "react";
import { ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addToCart } from "@/features/cart/cart";
import { playCartFlyAnimation } from "@/features/cart/cart-fly-animation";
import {
  adjustLocalCartItemCount,
  notifyCartChanged,
} from "@/features/cart/cart-client-sync";
import {
  acknowledgeOptimisticAdd,
  rollbackUpsertLocally,
  upsertItemLocally,
} from "@/features/cart/cart-drawer-local-store";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type AddToCartButtonProps = {
  productId: string;
  label: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  imageUrl?: string | null;
  /** Product title for optimistic drawer row. */
  title?: string;
  /** Product slug for optimistic drawer row. */
  slug?: string;
  /** Formatted unit price for optimistic drawer row. */
  unitPriceFormatted?: string;
  /** Display-currency minor units for optimistic totals. */
  unitPriceAmount?: number;
  locale?: Locale;
  currency?: Currency;
  /**
   * When set, navigates here instead of quick-adding (required options / sauces).
   */
  configureHref?: string;
};

export function AddToCartButton({
  productId,
  label,
  disabled = false,
  className = "",
  size = "md",
  imageUrl = null,
  title = "",
  slug = "",
  unitPriceFormatted = "",
  unitPriceAmount,
  locale,
  currency,
  configureHref,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const iconClass = size === "sm" ? "h-[29px] w-[29px]" : "h-5 w-5";

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || pending) return;

    if (configureHref) {
      router.push(configureHref);
      return;
    }

    const button = event.currentTarget;
    const card = button.closest("[data-product-card]");
    const origin =
      (card?.querySelector(
        "[data-product-fly-origin]",
      ) as HTMLElement | null) ?? button;

    const resolvedImage = imageUrl?.trim() || null;
    playCartFlyAnimation({
      fromElement: origin,
      imageUrl: resolvedImage,
    });

    const resolvedTitle =
      title.trim() ||
      card?.querySelector("h3")?.textContent?.trim() ||
      label;
    const resolvedSlug = slug.trim() || productId;
    const resolvedPrice = unitPriceFormatted.trim() || "…";
    const resolvedAmount =
      unitPriceAmount != null && Number.isFinite(unitPriceAmount)
        ? Math.max(0, Math.trunc(unitPriceAmount))
        : 0;
    const resolvedLocale = locale ?? "hy";
    const resolvedCurrency = currency ?? "AMD";

    const upsert = upsertItemLocally({
      productId,
      selectionKey: "",
      title: resolvedTitle,
      slug: resolvedSlug,
      quantity: 1,
      imageUrl: imageUrl,
      unitPriceAmount: resolvedAmount,
      unitPriceFormatted: resolvedPrice,
      locale: resolvedLocale,
      currency: resolvedCurrency,
      modifierLines: [],
    });
    adjustLocalCartItemCount(1);

    startTransition(async () => {
      try {
        await addToCart(productId, 1);
        acknowledgeOptimisticAdd();
        notifyCartChanged();
        setJustAdded(true);
        router.refresh();
        window.setTimeout(() => setJustAdded(false), 1500);
      } catch {
        rollbackUpsertLocally(upsert);
        adjustLocalCartItemCount(-1);
        setJustAdded(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <ShoppingBasket
        className={`${iconClass} ${justAdded ? "fill-current" : ""}`}
        aria-hidden
      />
    </button>
  );
}
