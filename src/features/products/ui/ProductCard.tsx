import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

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
  locale?: Locale;
  productId?: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel?: string;
  addToCartLabel?: string;
};

export function ProductCard({
  href,
  title,
  categoryTitle = null,
  priceFormatted,
  compareAtFormatted = null,
  discountPercent = null,
  imageUrl,
  inStock,
  priority = false,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
  addToCartLabel,
}: ProductCardProps) {
  const onSale = Boolean(compareAtFormatted);
  const showWishlist =
    locale != null && productId != null && wishlistLabel != null;
  const showAddToCart = productId != null && addToCartLabel != null;

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white shadow-[0px_7px_22px_rgba(62,87,61,0.13)] transition hover:-translate-y-0.5 hover:shadow-[0px_10px_28px_rgba(62,87,61,0.18)]">
      <div className="relative aspect-[279/214] overflow-hidden rounded-3xl bg-brand-surface">
        <AppLink
          href={href}
          prefetchPolicy={priority ? "intent" : "auto"}
          className="absolute inset-0 block"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 279px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
        </AppLink>

        {discountPercent != null ? (
          <span className="absolute top-3.5 left-4 z-10 inline-flex h-[26px] min-w-[90px] items-center justify-center rounded-full bg-brand-yellow px-3 text-[11px] font-semibold text-[#222]">
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
            size="sm"
            className="absolute top-3 right-3 z-10 h-8 w-8 bg-transparent text-[#222] shadow-none hover:bg-white/80"
          />
        ) : null}

        {!inStock ? (
          <span className="absolute bottom-3 left-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="relative px-4 pt-3 pb-5">
        <h3 className="line-clamp-1 text-base font-bold text-[#111]">
          <AppLink
            href={href}
            prefetchPolicy={priority ? "intent" : "auto"}
            className="hover:underline"
          >
            {title}
          </AppLink>
        </h3>
        {categoryTitle ? (
          <p className="mt-1 text-base font-semibold text-[rgba(17,17,17,0.54)]">
            {categoryTitle}
          </p>
        ) : (
          <div className="mt-1 h-6" aria-hidden />
        )}

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-2xl leading-5 font-extrabold text-[#0d0d0d]">
              {priceFormatted}
            </p>
            {onSale ? (
              <p className="text-sm font-extrabold text-[#bababa] line-through">
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
              className="h-[51px] w-[51px] shrink-0 bg-brand-red text-white hover:bg-brand-red-hot [&>svg]:text-white [&>svg]:fill-none"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
