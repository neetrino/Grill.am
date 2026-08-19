"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { toggleWishlistAction } from "@/features/wishlist/actions";
import {
  adjustWishlistCountDelta,
  setWishlistOverride,
  useWishlistMembership,
} from "@/features/wishlist/wishlist-client-sync";
import type { Locale } from "@/lib/i18n/config";

type WishlistButtonProps = {
  locale: Locale;
  productId: string;
  initialInWishlist: boolean;
  isSignedIn: boolean;
  label: string;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistButton({
  locale,
  productId,
  initialInWishlist,
  isSignedIn,
  label,
  className = "",
  size = "md",
}: WishlistButtonProps) {
  const router = useRouter();
  const inWishlist = useWishlistMembership(productId, initialInWishlist);
  const iconClass = size === "sm" ? "size-[17px]" : "size-[21px]";

  /** Runs after the optimistic flip; reverts the heart and badge on failure. */
  async function syncWishlist(next: boolean): Promise<void> {
    const result = await toggleWishlistAction(productId);

    if (!result.ok) {
      setWishlistOverride(productId, !next);
      adjustWishlistCountDelta(next ? -1 : 1);
      if (result.error.code === "UNAUTHENTICATED") {
        router.push(`/${locale}/login`);
      }
      return;
    }

    if (result.value.inWishlist !== next) {
      setWishlistOverride(productId, result.value.inWishlist);
      adjustWishlistCountDelta(result.value.inWishlist ? 2 : -2);
    }
    router.refresh();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();

    if (!isSignedIn) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : `/${locale}`,
      );
      router.push(`/${locale}/login?next=${next}`);
      return;
    }

    const next = !inWishlist;
    setWishlistOverride(productId, next);
    adjustWishlistCountDelta(next ? 1 : -1);
    void syncWishlist(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={inWishlist}
      className={`inline-flex items-center justify-center rounded-full transition ${
        inWishlist
          ? "bg-transparent hover:bg-transparent"
          : "bg-brand-red hover:bg-brand-red-hot"
      } ${className}`}
    >
      <Heart
        className={`${iconClass} ${
          inWishlist ? "fill-brand-red text-brand-red" : "fill-white text-white"
        }`}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
