import Image from "next/image";
import type { CSSProperties } from "react";
import { Zap } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const PRODUCT_CARD_IMAGE = staticAssetUrl(
  "/assets/products/product-card.webp",
);

type FeaturedProductCardProps = {
  href: string;
  title: string;
  categoryTitle?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  inStock: boolean;
  priority?: boolean;
  appearStyle?: CSSProperties;
  appearClass: string;
  locale?: Locale;
  productId?: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel?: string;
  addToCartLabel?: string;
  requiresConfiguration?: boolean;
  tone: "red" | "light";
};

/**
 * Figma mobile featured cards `164:457` (red) / `164:505` (light).
 */
export function FeaturedProductCard({
  href,
  title,
  categoryTitle = null,
  priceFormatted,
  compareAtFormatted = null,
  discountPercent = null,
  inStock,
  priority = false,
  appearStyle,
  appearClass,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
  addToCartLabel,
  requiresConfiguration = false,
  tone,
}: FeaturedProductCardProps) {
  const isRed = tone === "red";
  const onSale = Boolean(compareAtFormatted);
  const showWishlist =
    locale != null && productId != null && wishlistLabel != null;
  const showAddToCart = productId != null && addToCartLabel != null;

  return (
    <article
      data-product-card
      className={`group relative flex w-[210px] shrink-0 flex-col overflow-hidden rounded-[20px] ${
        isRed
          ? "bg-brand-red"
          : "bg-white shadow-[0px_7px_11px_rgba(62,87,61,0.13)]"
      } ${appearClass}`}
      style={appearStyle}
    >
      <div
        data-product-fly-origin
        className="relative h-[155px] shrink-0 overflow-hidden rounded-[20px] bg-brand-surface"
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
            sizes="210px"
            className="object-cover"
            priority={priority}
          />
        </AppLink>

        {discountPercent != null ? (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2 py-[3px] text-[10px] leading-[15px] font-semibold text-[#222]">
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
            className="absolute top-1.5 right-1.5 z-10 size-9 bg-transparent shadow-none hover:bg-transparent"
          />
        ) : null}
      </div>

      <div
        className={`flex flex-col justify-center gap-2 px-3 py-2 ${
          isRed ? "text-white" : "text-[rgba(17,17,17,0.54)]"
        }`}
      >
        <div className="min-w-0">
          {categoryTitle ? (
            <p
              className={`line-clamp-1 text-[11px] leading-[16.5px] ${
                isRed ? "text-white/54" : ""
              }`}
            >
              {categoryTitle}
            </p>
          ) : null}
          <h3
            className={`line-clamp-1 text-[13px] leading-[16.25px] font-bold ${
              isRed ? "text-white" : "text-[#111]"
            }`}
          >
            <AppLink
              href={href}
              prefetchPolicy={priority ? "intent" : "auto"}
            >
              {title}
            </AppLink>
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`text-base leading-4 font-extrabold ${
                isRed ? "text-white" : "text-[#0d0d0d]"
              }`}
            >
              {priceFormatted}
            </p>
            {onSale ? (
              <p
                className={`text-[11px] leading-[16.5px] line-through ${
                  isRed ? "text-white" : "text-[#bababa]"
                }`}
              >
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
              className={
                isRed
                  ? "size-9 shrink-0 rounded-full bg-white text-brand-red hover:bg-white/90 disabled:bg-white/40 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-brand-red"
                  : "size-9 shrink-0 rounded-full bg-brand-red text-white hover:bg-brand-red-hot disabled:bg-brand-red/40 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-white"
              }
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
