"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
import andranikPhoto from "../../../../public/assets/stores/andranik.webp";
import baghramyanPhoto from "../../../../public/assets/stores/baghramyan.webp";
import davitashenPhoto from "../../../../public/assets/stores/davitashen.webp";
import isakovPhoto from "../../../../public/assets/stores/isakov.webp";
import khorenatsi88Photo from "../../../../public/assets/stores/khorenatsi-88.webp";
import pushkinPhoto from "../../../../public/assets/stores/pushkin.webp";
import sebastiaPhoto from "../../../../public/assets/stores/sebastia.webp";
import totoventsPhoto from "../../../../public/assets/stores/totovents.webp";

export type HomeBranchItem = {
  id: string;
  href: string;
  title: string;
  address: string;
  phone: string;
  imageUrl: string | null;
};

type HomeBranchesProps = {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  previousLabel: string;
  nextLabel: string;
  branches: readonly HomeBranchItem[];
};

const ARROW_BUTTON_CLASS =
  "hidden size-12 shrink-0 items-center justify-center rounded-full bg-black text-brand-yellow transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow md:flex";

const BRANCH_LOGO = staticAssetUrl("/assets/brand/logo.webp");

const BRANCH_PHOTOS: Partial<Record<string, typeof andranikPhoto>> = {
  "andranik-94-4": andranikPhoto,
  "baghramyan-50-5": baghramyanPhoto,
  "isakov-27": isakovPhoto,
  "khorenatsi-88": khorenatsi88Photo,
  "pushkin-43-3": pushkinPhoto,
  "sebastia-16-1": sebastiaPhoto,
  "tigran-petrosyan-13-8": davitashenPhoto,
  "totovents-2-7": totoventsPhoto,
};
const SCROLL_STEP_FALLBACK_PX = 260;
const SCROLL_EDGE_TOLERANCE_PX = 1;

function readScrollStepPx(scroller: HTMLElement): number {
  const firstItem = scroller.querySelector("li");
  if (!(firstItem instanceof HTMLElement)) return SCROLL_STEP_FALLBACK_PX;

  const gapValue = Number.parseFloat(getComputedStyle(scroller).gap);
  const gap = Number.isFinite(gapValue) ? gapValue : 0;
  return firstItem.offsetWidth + gap;
}

function BranchScroller({
  branches,
  previousLabel,
  nextLabel,
}: {
  branches: readonly HomeBranchItem[];
  previousLabel: string;
  nextLabel: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const showArrows = branches.length > 3;

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

    node.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-4">
      {showArrows ? (
        <button
          type="button"
          aria-label={previousLabel}
          onClick={() => scrollByDirection(-1)}
          className={ARROW_BUTTON_CLASS}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      ) : null}
      <ul
        ref={scrollerRef}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-x-hidden"
      >
        {branches.map((branch) => (
          <li
            key={branch.id}
            className="w-[210px] shrink-0 snap-start md:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-4rem)/5)]"
          >
            <BranchCard branch={branch} />
          </li>
        ))}
      </ul>
      {showArrows ? (
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => scrollByDirection(1)}
          className={ARROW_BUTTON_CLASS}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function BranchCard({ branch }: { branch: HomeBranchItem }) {
  const photo = BRANCH_PHOTOS[branch.id] ?? branch.imageUrl;

  return (
    <AppLink
      href={branch.href}
      prefetchPolicy="intent"
      className="flex h-full flex-col overflow-hidden rounded-[20px] bg-brand-red text-white"
    >
      <div className="relative h-[155px] w-full shrink-0 overflow-hidden rounded-[20px] bg-white">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="210px"
            className="object-cover object-top"
          />
        ) : (
          <Image
            src={BRANCH_LOGO}
            alt=""
            fill
            sizes="210px"
            className="object-contain p-8"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <h3 className="line-clamp-1 text-base leading-5 font-bold">
          {branch.title}
        </h3>
        <p className="line-clamp-1 text-sm leading-5">{branch.address}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base leading-5 font-extrabold">{branch.phone}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-red">
            <MapPin className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </AppLink>
  );
}

export function HomeBranches({
  title,
  viewAllLabel,
  viewAllHref,
  previousLabel,
  nextLabel,
  branches,
}: HomeBranchesProps) {
  if (branches.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white py-6 md:py-10 lg:py-12">
      <div className="page-container">
        <div className="mb-5 flex items-center justify-between gap-3 md:mb-8">
          <h2 className="flex min-w-0 items-center gap-2 text-[20px] leading-tight font-black text-[#171717] uppercase md:text-[26px] lg:text-[30px]">
            <MapPin className="size-5 shrink-0 text-brand-red md:size-6" aria-hidden />
            <span className="truncate">{title}</span>
          </h2>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-brand-red md:text-sm"
          >
            {viewAllLabel}
            <ChevronRight className="size-4" aria-hidden />
          </AppLink>
        </div>

        <BranchScroller
          branches={branches}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
        />
      </div>
    </section>
  );
}
