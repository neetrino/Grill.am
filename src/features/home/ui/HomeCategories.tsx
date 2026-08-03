"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";

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
  "/assets/home/category-1.png",
  "/assets/home/category-2.png",
  "/assets/home/category-3.png",
  "/assets/home/category-4.png",
] as const;

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

  function scrollByDirection(direction: -1 | 1): void {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  return (
    <section className="relative z-10 -mt-12 rounded-t-[30px] bg-white pt-14 pb-14 sm:-mt-20 sm:pt-16 sm:pb-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
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

            <ul
              ref={scrollerRef}
              className="flex snap-x snap-mandatory justify-start gap-5 overflow-x-auto pb-2 sm:gap-6 xl:justify-center xl:gap-7 xl:overflow-visible xl:px-16 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

            <div className="mt-5 flex items-center justify-center gap-1.5">
              <span className="h-2.5 w-7 rounded-full bg-brand-red-hot" />
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(95,95,95,0.61)]" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
