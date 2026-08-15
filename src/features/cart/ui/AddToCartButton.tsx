"use client";

import type { MouseEvent } from "react";
import { ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addCartLineQuantity } from "@/features/cart/cart-line-coordinator";
import { playCartFlyAnimation } from "@/features/cart/cart-fly-animation";
import { EMPTY_CART_MODIFIERS } from "@/features/products/domain/customization";
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
  const [justAdded, setJustAdded] = useState(false);
  const iconClass = size === "sm" ? "h-[29px] w-[29px]" : "h-5 w-5";

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

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

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);

    void addCartLineQuantity({
      productId,
      selectionKey: "",
      addQuantity: 1,
      modifiers: EMPTY_CART_MODIFIERS,
      display: {
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
      },
    }).catch(() => {
      setJustAdded(false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
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
