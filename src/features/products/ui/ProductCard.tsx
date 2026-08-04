import Image from "next/image";
import type { CSSProperties } from "react";
import { Zap } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import {
  FeaturedProductCard,
} from "@/features/products/ui/FeaturedProductCard";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

/** Shared product-card photo until per-product media is ready. */
export const PRODUCT_CARD_IMAGE = "/assets/products/product-card.webp";

/** Stagger step for catalog grid appear (MaMarie products listing). */
export const PRODUCT_CARD_APPEAR_STAGGER_MS = 70;
export const PRODUCT_CARD_APPEAR_DURATION_MS = 560;
/** Cap delay so long grids do not feel sluggish. */
const PRODUCT_CARD_APPEAR_MAX_INDEX = 11;

export type ProductCardVariant = "catalog" | "featured-red" | "featured-light";

type ProductCardProps = {
  href: string;
  title: string;
  categoryTitle?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  priority?: boolean;
  /** When set, card fades/rises in with a staggered delay (catalog grids). */
  appearIndex?: number;
  /**
   * Gate for scroll-triggered reveals. Defaults to true when `appearIndex` is set.
   * Pass false until the section enters the viewport.
   */
  appearActive?: boolean;
  locale?: Locale;
  productId?: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel?: string;
  addToCartLabel?: string;
  /** When true, cart CTA opens the product page for option selection. */
  requiresConfiguration?: boolean;
  /** Figma mobile featured carousel variants (`164:457` / `164:505`). */
  variant?: ProductCardVariant;
};

export function ProductCard({
  href,
  title,
  categoryTitle = null,
  priceFormatted,
  compareAtFormatted = null,
  discountPercent = null,
  imageUrl: _imageUrl,
  inStock,
  priority = false,
  appearIndex,
  appearActive,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
  addToCartLabel,
  requiresConfiguration = false,
  variant = "catalog",
}: ProductCardProps) {
  const onSale = Boolean(compareAtFormatted);
  const showWishlist =
    locale != null && productId != null && wishlistLabel != null;
  const showAddToCart = productId != null && addToCartLabel != null;
  const appearStyle: CSSProperties | undefined =
    appearIndex == null
      ? undefined
      : ({
          "--product-appear-delay": `${Math.min(appearIndex, PRODUCT_CARD_APPEAR_MAX_INDEX) * PRODUCT_CARD_APPEAR_STAGGER_MS}ms`,
          "--product-appear-duration": `${PRODUCT_CARD_APPEAR_DURATION_MS}ms`,
        } as CSSProperties);
  const appearClass =
    appearIndex == null
      ? ""
      : (appearActive ?? true)
        ? "animate-catalog-grid-in"
        : "product-appear-pending";

  if (variant === "featured-red" || variant === "featured-light") {
    return (
      <FeaturedProductCard
        href={href}
        title={title}
        categoryTitle={categoryTitle}
        priceFormatted={priceFormatted}
        compareAtFormatted={compareAtFormatted}
        discountPercent={discountPercent}
        inStock={inStock}
        priority={priority}
        appearStyle={appearStyle}
        appearClass={appearClass}
        locale={locale}
        productId={productId}
        inWishlist={inWishlist}
        isSignedIn={isSignedIn}
        wishlistLabel={wishlistLabel}
        addToCartLabel={addToCartLabel}
        requiresConfiguration={requiresConfiguration}
        tone={variant === "featured-red" ? "red" : "light"}
      />
    );
  }

  return (
    <article
      data-product-card
      className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white transition hover:-translate-y-0.5 ${appearClass}`}
      style={appearStyle}
    >
      <div
        data-product-fly-origin
        className="relative aspect-[279/214] shrink-0 overflow-hidden bg-brand-surface"
      >
        <AppLink
          href={href}
          prefetchPolicy={priority ? "intent" : "auto"}
          className="absolute inset-0 z-[1] block"
        >
          <Image
            src={PRODUCT_CARD_IMAGE}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 279px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        </AppLink>

        {discountPercent != null ? (
          <span className="absolute top-3.5 left-4 z-10 inline-flex h-[26px] items-center gap-1.5 rounded-full bg-brand-yellow pr-3 pl-[13px] text-[11px] leading-[18px] font-semibold text-[#222]">
            <Zap className="h-3 w-3 shrink-0 fill-current" aria-hidden />
            -{discountPercent}%
          </span>
        ) : null}

        {showWishlist ? (
          <WishlistButton
            locale={locale}
            productId={productId}
            initialInWishlist={inWishlist}
            isSignedIn={isSignedIn}
            label={wishlistLabel}
            size="md"
            tone="onImage"
            className="absolute top-1.5 right-2 z-10 h-10 w-10 bg-transparent shadow-none hover:bg-transparent md:top-2 md:right-3"
          />
        ) : null}

        {!inStock ? (
          <span className="absolute bottom-3 left-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pt-2.5 pb-3">
        <h3 className="line-clamp-1 text-base leading-6 font-bold text-[#111]">
          <AppLink
            href={href}
            prefetchPolicy={priority ? "intent" : "auto"}
            className="hover:underline"
          >
            {title}
          </AppLink>
        </h3>
        {categoryTitle ? (
          <p className="mt-0.5 line-clamp-1 text-base leading-6 font-semibold text-[rgba(17,17,17,0.54)]">
            {categoryTitle}
          </p>
        ) : (
          <div className="mt-0.5 h-6" aria-hidden />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-xl leading-5 font-extrabold text-[#0d0d0d] md:text-2xl">
              {priceFormatted}
            </p>
            {onSale ? (
              <p className="text-xs leading-5 font-extrabold text-[#bababa] line-through md:text-sm">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>

          {showAddToCart ? (
            <AddToCartButton
              productId={productId}
              label={addToCartLabel}
              disabled={!inStock}
              size="sm"
              imageUrl={PRODUCT_CARD_IMAGE}
              configureHref={requiresConfiguration ? href : undefined}
              className="h-11 w-11 shrink-0 -translate-y-1 translate-x-2.5 rounded-full bg-brand-red text-white hover:bg-brand-red-hot disabled:bg-brand-red/40 md:h-[51px] md:w-[51px] md:translate-x-0 md:translate-y-0 md:rounded-[45px] [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-white md:[&>svg]:h-[29px] md:[&>svg]:w-[29px]"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
