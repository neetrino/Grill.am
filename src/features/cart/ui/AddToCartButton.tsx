"use client";

import type { MouseEvent } from "react";
import { ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addToCart } from "@/features/cart/cart";
import { playCartFlyAnimation } from "@/features/cart/cart-fly-animation";
import { notifyCartChanged } from "@/features/cart/cart-client-sync";
import { PRODUCT_CARD_IMAGE } from "@/features/products/ui/ProductCard";

type AddToCartButtonProps = {
  productId: string;
  label: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  imageUrl?: string | null;
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

    playCartFlyAnimation({
      fromElement: origin,
      imageUrl: imageUrl || PRODUCT_CARD_IMAGE,
    });

    startTransition(async () => {
      try {
        await addToCart(productId, 1);
        notifyCartChanged();
        setJustAdded(true);
        router.refresh();
        window.setTimeout(() => setJustAdded(false), 1500);
      } catch {
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
