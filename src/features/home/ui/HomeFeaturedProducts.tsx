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
};

type HomeFeaturedProductsProps = {
  locale: Locale;
  currency: Currency;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
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
      variant={variant}
    />
  );
}

export function HomeFeaturedProducts({
  locale,
  currency,
  titleLead,
  titleAccent,
  subtitle,
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
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden bg-white pt-5 pb-6 md:rounded-[30px] md:bg-brand-yellow-soft md:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-[var(--page-padding-inline)]">
        <div className="mb-4 flex items-start justify-between gap-3 md:mb-10 md:items-end">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-[25px] font-black text-brand-red md:text-[26px] md:leading-tight md:uppercase lg:text-[30px] lg:leading-[1.2]">
              {titleLead}{" "}
              <span className="text-[#171717]">{titleAccent}</span>
            </h2>
            <p className="mt-2 hidden max-w-3xl text-base leading-6 text-[#171717] md:block">
              {subtitle}
            </p>
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
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {products.map((product, index) => (
                <FeaturedGridCard
                  key={product.id}
                  product={product}
                  index={index}
                  cardsRevealed={cardsRevealed}
                  locale={locale}
                  currency={currency}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  addToCartLabel={addToCartLabel}
                  variant="featured-red"
                />
              ))}
            </div>

            <div className="hidden grid-cols-4 gap-3 sm:gap-5 md:grid lg:gap-6 xl:gap-8">
              {products.map((product, index) => (
                <FeaturedGridCard
                  key={product.id}
                  product={product}
                  index={index}
                  cardsRevealed={cardsRevealed}
                  locale={locale}
                  currency={currency}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  addToCartLabel={addToCartLabel}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
