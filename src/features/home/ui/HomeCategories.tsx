"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type CategoryItem = {
  id: string;
  href: string;
  title: string;
  imageUrl: string | null;
};

type HomeCategoriesProps = {
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  categories: readonly CategoryItem[];
};

const FALLBACK_IMAGES = [
  staticAssetUrl("/assets/home/category-1.webp"),
  staticAssetUrl("/assets/home/category-2.webp"),
  staticAssetUrl("/assets/home/category-3.webp"),
  staticAssetUrl("/assets/home/category-4.webp"),
] as const;

/** One arrow click ≈ one desktop card plus its gap. */
const SCROLL_STEP_PX = 300;

/** Absorbs fractional scroll offsets so the edges are detected reliably. */
const SCROLL_EDGE_TOLERANCE_PX = 1;

export function HomeCategories({
  titleLead,
  titleAccent,
  subtitle,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  categories,
}: HomeCategoriesProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  /** Wraps around at both edges so the arrows never dead-end. */
  function scrollByDirection(direction: -1 | 1): void {
    const node = scrollerRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    if (maxScrollLeft <= 0) return;

    if (
      direction === 1 &&
      node.scrollLeft >= maxScrollLeft - SCROLL_EDGE_TOLERANCE_PX
    ) {
      node.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (direction === -1 && node.scrollLeft <= SCROLL_EDGE_TOLERANCE_PX) {
      node.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      return;
    }

    node.scrollBy({
      left: direction * SCROLL_STEP_PX,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative z-10 bg-white pt-6 pb-6 md:-mt-12 md:rounded-t-[30px] md:pt-14 md:pb-14 lg:-mt-20 lg:pt-16 lg:pb-16">
      <div className="page-container">
        <div className="mb-8 hidden flex-col gap-3 md:mb-10 md:flex md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0">
            <h2 className="text-[26px] leading-tight font-black tracking-tight text-[#171717] uppercase sm:text-[30px] sm:leading-[1.2]">
              {titleLead}{" "}
              <span className="text-brand-red-hot">{titleAccent}</span>
            </h2>
            <p className="mt-2 text-base leading-6 text-[#171717]">{subtitle}</p>
          </div>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tracking-[1.4px] text-brand-red-hot uppercase"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </AppLink>
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-600">{emptyLabel}</p>
        ) : (
          <div className="relative">
            <button
              type="button"
              aria-label="Previous categories"
              onClick={() => scrollByDirection(-1)}
              className="absolute top-[38%] left-0 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105 xl:flex"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next categories"
              onClick={() => scrollByDirection(1)}
              className="absolute top-[38%] right-0 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105 xl:flex"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>

            {/* Mobile — Figma `164:424` compact 88px cards */}
            <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category, index) => {
                const fallback =
                  FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ??
                  FALLBACK_IMAGES[0];
                const imageSrc = category.imageUrl ?? fallback;

                return (
                  <li key={category.id} className="shrink-0 snap-start">
                    <AppLink
                      href={category.href}
                      prefetchPolicy="intent"
                      className="flex flex-col items-center gap-2"
                    >
                      <span className="relative size-[88px] overflow-hidden rounded-[20px] bg-[#191919]">
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="88px"
                          className="object-cover"
                        />
                      </span>
                      <span className="text-center text-[11px] leading-[16.5px] font-bold text-[#171717] uppercase">
                        {category.title}
                      </span>
                    </AppLink>
                  </li>
                );
              })}
            </ul>

            {/* Desktop — existing large cards */}
            {/* `w-fit` centers the row while it fits and lets it scroll once
                it does not; `justify-center` would strand the leading cards. */}
            <ul
              ref={scrollerRef}
              className="hidden snap-x snap-mandatory justify-start gap-5 overflow-x-auto pb-2 sm:gap-6 md:flex xl:mx-auto xl:w-fit xl:max-w-full xl:gap-7 xl:px-16 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {categories.map((category, index) => {
                const fallback =
                  FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ??
                  FALLBACK_IMAGES[0];
                const imageSrc = category.imageUrl ?? fallback;

                return (
                  <li
                    key={category.id}
                    className="w-[min(64vw,240px)] shrink-0 snap-start sm:w-[260px] lg:w-[279px]"
                  >
                    <AppLink
                      href={category.href}
                      prefetchPolicy="intent"
                      className="group flex h-[260px] flex-col items-center justify-end overflow-hidden sm:h-[294px]"
                    >
                      <div className="relative mb-3 h-[180px] w-full sm:mb-4 sm:h-[210px]">
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="279px"
                          className="object-contain transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <span className="text-center text-sm font-bold tracking-wide text-[#171717] uppercase sm:text-base">
                        {category.title}
                      </span>
                    </AppLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
