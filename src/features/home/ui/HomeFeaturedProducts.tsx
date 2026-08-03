"use client";

import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

type FeaturedItem = {
  id: string;
  href: string;
  title: string;
  categoryTitle?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  requiresConfiguration?: boolean;
};

type HomeFeaturedProductsProps = {
  locale: Locale;
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

const PRODUCTS_PER_SLIDE = 4;

function chunkIntoSlides<T>(items: readonly T[], size: number): T[][] {
  const slides: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    slides.push(items.slice(index, index + size));
  }
  return slides;
}

export function HomeFeaturedProducts({
  locale,
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = chunkIntoSlides(products, PRODUCTS_PER_SLIDE);

  function goToSlide(slideIndex: number): void {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: node.clientWidth * slideIndex, behavior: "smooth" });
    setActiveSlide(slideIndex);
  }

  function handleScroll(): void {
    const node = scrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    setActiveSlide(Math.round(node.scrollLeft / node.clientWidth));
  }

  return (
    <section className="w-full overflow-hidden rounded-[30px] bg-brand-yellow-soft py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-[26px] leading-tight font-black text-brand-red uppercase sm:text-[30px] sm:leading-[1.2]">
              {titleLead}{" "}
              <span className="text-[#171717]">{titleAccent}</span>
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-6 text-[#171717]">
              {subtitle}
            </p>
          </div>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tracking-[1.4px] text-[#171717] uppercase"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </AppLink>
        </div>

        {products.length === 0 ? (
          <p className="text-[#171717]">{emptyLabel}</p>
        ) : (
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((slideProducts, slideIndex) => (
              <div
                key={slideProducts[0]?.id ?? `slide-${slideIndex}`}
                className="grid w-full shrink-0 snap-start grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8"
              >
                {slideProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    href={product.href}
                    title={product.title}
                    categoryTitle={product.categoryTitle}
                    priceFormatted={product.priceFormatted}
                    compareAtFormatted={product.compareAtFormatted}
                    discountPercent={product.discountPercent}
                    imageUrl={product.imageUrl}
                    inStock={product.inStock}
                    priority={slideIndex === 0 && index < 4}
                    locale={locale}
                    productId={product.id}
                    inWishlist={product.inWishlist ?? false}
                    isSignedIn={isSignedIn}
                    wishlistLabel={wishlistLabel}
                    addToCartLabel={addToCartLabel}
                    requiresConfiguration={
                      product.requiresConfiguration ?? false
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {slides.length > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-1.5 sm:mt-10">
            {slides.map((slideProducts, slideIndex) => {
              const isActive = slideIndex === activeSlide;
              return (
                <button
                  key={slideProducts[0]?.id ?? `dot-${slideIndex}`}
                  type="button"
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  aria-current={isActive}
                  onClick={() => goToSlide(slideIndex)}
                  className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out ${
                    isActive
                      ? "w-7 bg-white"
                      : "w-2.5 bg-[rgba(95,95,95,0.43)]"
                  }`}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
