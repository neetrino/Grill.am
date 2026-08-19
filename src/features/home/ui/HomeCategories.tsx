"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

/** Fallback if the scroller has not laid out yet. */
const SCROLL_STEP_FALLBACK_PX = 300;

/** Absorbs fractional scroll offsets so the edges are detected reliably. */
const SCROLL_EDGE_TOLERANCE_PX = 1;

function readScrollStepPx(scroller: HTMLElement): number {
  const firstItem = scroller.querySelector("li");
  if (!(firstItem instanceof HTMLElement)) return SCROLL_STEP_FALLBACK_PX;

  const gapValue = Number.parseFloat(getComputedStyle(scroller).gap);
  const gap = Number.isFinite(gapValue) ? gapValue : 0;
  return firstItem.offsetWidth + gap;
}

const ARROW_BUTTON_CLASS =
  "hidden size-14 shrink-0 items-center justify-center rounded-full bg-black text-brand-yellow transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow xl:flex";

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
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);

  /** Wraps around at both edges so the arrows never dead-end. */
  function scrollByDirection(direction: -1 | 1): void {
    const node = scrollerRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    if (maxScrollLeft <= 0) return;

    const step = readScrollStepPx(node);

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
      left: direction * step,
      behavior: "smooth",
    });
  }

  function syncPager(): void {
    const node = scrollerRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    if (maxScrollLeft <= 0) {
      setPageCount(1);
      setActivePage(0);
      return;
    }

    const step = readScrollStepPx(node);
    const count = Math.round(maxScrollLeft / step) + 1;
    const page = Math.min(
      count - 1,
      Math.max(0, Math.round(node.scrollLeft / step)),
    );
    setPageCount(count);
    setActivePage(page);
  }

  function goToPage(page: number): void {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: page * readScrollStepPx(node), behavior: "smooth" });
  }

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    syncPager();
    node.addEventListener("scroll", syncPager, { passive: true });
    window.addEventListener("resize", syncPager);
    return () => {
      node.removeEventListener("scroll", syncPager);
      window.removeEventListener("resize", syncPager);
    };
  }, [categories.length]);

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
          <div>
            {/* Mobile — Figma `164:424` compact 88px cards */}
            <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category, index) => {
                const fallback =
                  FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ??
                  FALLBACK_IMAGES[0];
                const imageSrc = category.imageUrl ?? fallback;

                return (
                  <li key={category.id} className="w-[88px] shrink-0 snap-start">
                    <AppLink
                      href={category.href}
                      prefetchPolicy="intent"
                      className="flex w-full flex-col items-center gap-2"
                    >
                      <span className="relative size-[88px] overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="88px"
                          className="object-contain"
                        />
                      </span>
                      <span className="line-clamp-2 w-full text-center text-[11px] leading-[16.5px] font-bold break-words text-[#171717] uppercase">
                        {category.title}
                      </span>
                    </AppLink>
                  </li>
                );
              })}
            </ul>

            <div className="hidden items-center gap-4 md:flex xl:gap-5">
              <button
                type="button"
                aria-label="Previous categories"
                onClick={() => scrollByDirection(-1)}
                className={ARROW_BUTTON_CLASS}
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <ul
                ref={scrollerRef}
                className="flex min-w-0 flex-1 snap-x snap-mandatory gap-8 overflow-x-hidden xl:gap-10"
              >
              {categories.map((category, index) => {
                const fallback =
                  FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] ??
                  FALLBACK_IMAGES[0];
                const imageSrc = category.imageUrl ?? fallback;

                return (
                  <li
                    key={category.id}
                    className="w-[calc((100%-8rem)/5)] max-w-[calc((100%-8rem)/5)] shrink-0 snap-start xl:w-[calc((100%-10rem)/5)] xl:max-w-[calc((100%-10rem)/5)]"
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
                          sizes="220px"
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
              <button
                type="button"
                aria-label="Next categories"
                onClick={() => scrollByDirection(1)}
                className={ARROW_BUTTON_CLASS}
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </div>

            {pageCount > 1 ? (
              <div className="mt-6 hidden items-center justify-center gap-1.5 md:flex">
                {Array.from({ length: pageCount }, (_, page) => {
                  const isActive = page === activePage;
                  return (
                    <button
                      key={page}
                      type="button"
                      aria-label={`Go to categories page ${page + 1}`}
                      aria-current={isActive}
                      onClick={() => goToPage(page)}
                      className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out ${
                        isActive
                          ? "w-7 bg-brand-red-hot"
                          : "w-2.5 bg-[rgba(95,95,95,0.43)]"
                      }`}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
