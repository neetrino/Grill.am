"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

function featuredVariant(index: number): "featured-red" | "featured-light" {
  return index % 4 < 2 ? "featured-red" : "featured-light";
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
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileDot, setMobileDot] = useState(0);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const slides = chunkIntoSlides(products, PRODUCTS_PER_SLIDE);

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

  function handleMobileScroll(): void {
    const node = mobileScrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    const cardWidth = 222;
    setMobileDot(Math.min(1, Math.round(node.scrollLeft / cardWidth) > 1 ? 1 : 0));
  }

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden bg-white pt-5 pb-6 md:rounded-[30px] md:bg-brand-yellow-soft md:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] md:px-5 lg:px-8 xl:px-10">
        <div className="mb-4 flex items-start justify-between gap-3 px-4 md:mb-10 md:items-end md:px-0">
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
          <p className="px-4 text-[#171717] md:px-0">{emptyLabel}</p>
        ) : (
          <>
            {/* Mobile carousel — Figma `164:456` */}
            <div
              ref={mobileScrollerRef}
              onScroll={handleMobileScroll}
              className="flex gap-3 overflow-x-auto px-4 pb-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {products.map((product, index) => (
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
                  appearIndex={index}
                  appearActive={cardsRevealed}
                  locale={locale}
                  productId={product.id}
                  inWishlist={product.inWishlist ?? false}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  addToCartLabel={addToCartLabel}
                  requiresConfiguration={
                    product.requiresConfiguration ?? false
                  }
                  variant={featuredVariant(index)}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
              <span
                className={`h-1.5 rounded-full transition-[width,background-color] ${
                  mobileDot === 0
                    ? "w-6 bg-brand-red"
                    : "w-1.5 bg-[rgba(95,95,95,0.43)]"
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-[width,background-color] ${
                  mobileDot === 1
                    ? "w-6 bg-brand-red"
                    : "w-1.5 bg-[rgba(95,95,95,0.43)]"
                }`}
              />
            </div>

            {/* Desktop slide grid */}
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="hidden snap-x snap-mandatory overflow-x-auto pb-2 md:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                      priority={false}
                      appearIndex={slideIndex * PRODUCTS_PER_SLIDE + index}
                      appearActive={cardsRevealed}
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
          </>
        )}

        {slides.length > 1 ? (
          <div className="mt-8 hidden items-center justify-center gap-1.5 sm:mt-10 md:flex">
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
