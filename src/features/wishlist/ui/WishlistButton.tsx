"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleWishlistAction } from "@/features/wishlist/actions";
import type { Locale } from "@/lib/i18n/config";

type WishlistButtonProps = {
  locale: Locale;
  productId: string;
  initialInWishlist: boolean;
  isSignedIn: boolean;
  label: string;
  className?: string;
  size?: "sm" | "md";
  /**
   * Heart contrast on product imagery.
   * - `onImage` — solid white (product cards)
   * - `onImageBrand` — white fill + brand-red stroke (PDP Figma 164:1041)
   */
  tone?: "default" | "onImage" | "onImageBrand";
};

/** Figma PDP wishlist heart — node 164:1041 (26×23). Path is exported inverted. */
function PdpWishlistHeart({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 26 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-[23px] w-[26px] shrink-0 rotate-180"
    >
      <path
        d="M14.4355 2.31055C15.7498 3.28584 17.2086 4.5277 18.8135 6.04199C20.3941 7.53347 21.8446 9.1734 23.1641 10.9629C24.4361 12.6881 25 14.2431 25 15.6455C25 16.5431 24.8367 17.3626 24.5195 18.1152C24.1755 18.909 23.726 19.5885 23.1729 20.1621C22.6245 20.7307 21.9733 21.1802 21.21 21.5107C20.4582 21.8363 19.6628 22 18.8145 22C17.7733 22 16.836 21.7614 15.9834 21.292C15.1043 20.8081 14.3834 20.1714 13.8115 19.376L13 18.2461L12.1885 19.376C11.6166 20.1714 10.8957 20.8081 10.0166 21.292C9.16396 21.7614 8.22668 22 7.18555 22C6.28638 22 5.4657 21.8672 4.71582 21.6113L4.70996 21.6104L4.43262 21.5098C3.79933 21.2624 3.25434 20.9206 2.78809 20.4873C2.26619 20.0023 1.82671 19.3632 1.48438 18.543C1.17207 17.7723 1.00003 16.8149 1 15.6455C1 14.1468 1.57158 12.5478 2.83594 10.833L2.83887 10.8291C4.15698 9.02462 5.60534 7.3875 7.18262 5.91602C8.78559 4.42057 10.2411 3.20699 11.5508 2.26855C12.1733 1.8225 12.6529 1.47829 12.9893 1.2373C13.326 1.48717 13.8082 1.84502 14.4355 2.31055Z"
        fill={active ? "#DB0B20" : "white"}
        stroke="#DB0B20"
        strokeWidth={2}
      />
    </svg>
  );
}

export function WishlistButton({
  locale,
  productId,
  initialInWishlist,
  isSignedIn,
  label,
  className = "",
  size = "md",
  tone = "default",
}: WishlistButtonProps) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();
  const iconClass = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const idleIconClass =
    tone === "onImage"
      ? "fill-white text-white"
      : "fill-transparent text-gray-700";

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

    startTransition(async () => {
      const previous = inWishlist;
      setInWishlist(!previous);
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        setInWishlist(previous);
        if (result.error.code === "UNAUTHENTICATED") {
          router.push(`/${locale}/login`);
        }
        return;
      }
      setInWishlist(result.value.inWishlist);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      aria-pressed={inWishlist}
      className={`inline-flex items-center justify-center rounded-full transition disabled:opacity-60 ${className}`}
    >
      {tone === "onImageBrand" ? (
        <PdpWishlistHeart active={inWishlist} />
      ) : (
        <Heart
          className={`${iconClass} ${
            inWishlist ? "fill-brand-red text-brand-red" : idleIconClass
          }`}
          aria-hidden
        />
      )}
    </button>
  );
}
