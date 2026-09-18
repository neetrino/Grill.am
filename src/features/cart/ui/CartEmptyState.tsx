import Image from "next/image";
import { ShoppingCart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

/** Local `public/` asset — not on R2 yet; do not wrap with `staticAssetUrl`. */
const EMPTY_CART_MASCOT_SRC = "/assets/cart/empty-cart-flame.png";
const EMPTY_CART_MASCOT_WIDTH = 551;
const EMPTY_CART_MASCOT_HEIGHT = 640;

type CartEmptyStateProps = {
  title: string;
  /** When omitted, the catalog CTA is hidden (e.g. already on products). */
  catalogLabel?: string;
  catalogHref?: string;
  onCatalogClick?: () => void;
  /** Compact circle for the catalog sidebar. */
  size?: "default" | "compact";
};

/** Empty cart content — illustration, copy, optional catalog CTA (drawer / sidebar). */
export function CartEmptyState({
  title,
  catalogLabel,
  catalogHref,
  onCatalogClick,
  size = "default",
}: CartEmptyStateProps) {
  const isCompact = size === "compact";
  const showCatalogCta =
    catalogLabel != null &&
    catalogLabel.length > 0 &&
    catalogHref != null &&
    catalogHref.length > 0;

  return (
    <div
      className={`flex h-full flex-col items-center justify-center text-center ${
        isCompact
          ? "gap-5 px-2 py-6 pt-8"
          : "gap-8 px-2 py-6 pt-10 sm:gap-10 sm:pt-14"
      }`}
    >
      <Image
        src={EMPTY_CART_MASCOT_SRC}
        alt=""
        width={EMPTY_CART_MASCOT_WIDTH}
        height={EMPTY_CART_MASCOT_HEIGHT}
        sizes={isCompact ? "96px" : "248px"}
        unoptimized
        className={
          isCompact ? "h-24 w-auto" : "-mt-2 h-[220px] w-auto sm:h-[248px]"
        }
        aria-hidden
      />

      <h3
        className={`font-bold tracking-tight text-[#101828] ${
          isCompact ? "text-base" : "text-lg sm:text-xl"
        }`}
      >
        {title}
      </h3>

      {showCatalogCta ? (
        <AppLink
          href={catalogHref}
          prefetchPolicy="intent"
          onClick={onCatalogClick}
          className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        >
          <ShoppingCart className="size-4 shrink-0" aria-hidden />
          {catalogLabel}
        </AppLink>
      ) : null}
    </div>
  );
}
