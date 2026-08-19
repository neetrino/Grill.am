"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  ProductCard,
  type ProductCardVariant,
} from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type FeaturedItem = {
  id: string;
  href: string;
  title: string;
  categoryTitle?: string | null;
  priceFormatted: string;
  unitPriceAmount?: number;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  requiresConfiguration?: boolean;
  hitLabel?: string | null;
};

const MOBILE_FEATURED_COUNT = 4;
const TABLET_FEATURED_COUNT = 8;
const DESKTOP_FEATURED_COUNT = 10;

type HomeFeaturedProductsProps = {
  locale: Locale;
  currency: Currency;
  titleLead: string;
  titleAccent: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  isSignedIn: boolean;
  products: readonly FeaturedItem[];
};

function FeaturedGridCard({
  product,
  index,
  cardsRevealed,
  locale,
  currency,
  isSignedIn,
  wishlistLabel,
  addToCartLabel,
  variant,
}: {
  product: FeaturedItem;
  index: number;
  cardsRevealed: boolean;
  locale: Locale;
  currency: Currency;
  isSignedIn: boolean;
  wishlistLabel: string;
  addToCartLabel: string;
  variant?: ProductCardVariant;
}) {
  return (
    <ProductCard
      href={product.href}
      title={product.title}
      categoryTitle={product.categoryTitle}
      priceFormatted={product.priceFormatted}
      unitPriceAmount={product.unitPriceAmount}
      compareAtFormatted={product.compareAtFormatted}
      discountPercent={product.discountPercent}
      imageUrl={product.imageUrl}
      inStock={product.inStock}
      appearIndex={index}
      appearActive={cardsRevealed}
      locale={locale}
      currency={currency}
      productId={product.id}
      inWishlist={product.inWishlist ?? false}
      isSignedIn={isSignedIn}
      wishlistLabel={wishlistLabel}
      addToCartLabel={addToCartLabel}
      requiresConfiguration={product.requiresConfiguration ?? false}
      hitLabel={product.hitLabel}
      variant={variant}
    />
  );
}

function FeaturedProductGrid({
  className,
  products,
  cardsRevealed,
  locale,
  currency,
  isSignedIn,
  wishlistLabel,
  addToCartLabel,
  variant,
  hideLastBelowLg = false,
}: {
  className: string;
  products: readonly FeaturedItem[];
  cardsRevealed: boolean;
  locale: Locale;
  currency: Currency;
  isSignedIn: boolean;
  wishlistLabel: string;
  addToCartLabel: string;
  variant?: ProductCardVariant;
  hideLastBelowLg?: boolean;
}) {
  return (
    <div className={className}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className={
            hideLastBelowLg && index >= TABLET_FEATURED_COUNT
              ? "min-w-0 max-lg:hidden"
              : "min-w-0"
          }
        >
          <FeaturedGridCard
            product={product}
            index={index}
            cardsRevealed={cardsRevealed}
            locale={locale}
            currency={currency}
            isSignedIn={isSignedIn}
            wishlistLabel={wishlistLabel}
            addToCartLabel={addToCartLabel}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}

export function HomeFeaturedProducts({
  locale,
  currency,
  titleLead,
  titleAccent,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  addToCartLabel,
  isSignedIn,
  products,
}: HomeFeaturedProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }

    function reveal(): void {
      setCardsRevealed(true);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frameId = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(frameId);
    }

    if (typeof IntersectionObserver === "undefined") {
      const frameId = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        reveal();
        observer.disconnect();
      },
      { threshold: 0.01, rootMargin: "160px 0px 0px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-clip bg-white pt-5 pb-6 md:rounded-[30px] md:bg-brand-yellow-soft md:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-[var(--page-padding-inline)]">
        <div className="mb-4 flex items-start justify-between gap-3 md:mb-10 md:items-end">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-[25px] font-black text-brand-red md:text-[26px] md:leading-tight md:uppercase lg:text-[30px] lg:leading-[1.2]">
              {titleLead}{" "}
              <span className="text-[#171717]">{titleAccent}</span>
            </h2>
          </div>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex shrink-0 items-center gap-1 pt-1.5 text-[11px] font-bold tracking-[1.1px] text-[#171717] uppercase md:pt-0 md:text-sm md:tracking-[1.4px]"
          >
            {viewAllLabel}
            <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
          </AppLink>
        </div>

        {products.length === 0 ? (
          <p className="text-[#171717]">{emptyLabel}</p>
        ) : (
          <>
            <FeaturedProductGrid
              className="grid grid-cols-2 gap-3 md:hidden"
              products={products.slice(0, MOBILE_FEATURED_COUNT)}
              cardsRevealed={cardsRevealed}
              locale={locale}
              currency={currency}
              isSignedIn={isSignedIn}
              wishlistLabel={wishlistLabel}
              addToCartLabel={addToCartLabel}
              variant="featured-red"
            />
            <FeaturedProductGrid
              className="hidden grid-cols-4 gap-3 sm:gap-5 md:grid lg:grid-cols-5 lg:gap-5 xl:gap-6"
              products={products.slice(0, DESKTOP_FEATURED_COUNT)}
              cardsRevealed={cardsRevealed}
              locale={locale}
              currency={currency}
              isSignedIn={isSignedIn}
              wishlistLabel={wishlistLabel}
              addToCartLabel={addToCartLabel}
              hideLastBelowLg
            />
          </>
        )}
      </div>
    </section>
  );
}
