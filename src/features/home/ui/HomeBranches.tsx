"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  branchAppearClass,
  branchAppearStyle,
  useViewportReveal,
} from "@/features/home/ui/home-branches-appear";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

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

function splitSecondWordAccent(title: string): {
  lead: string;
  accent: string;
} {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const [lead = "", ...rest] = words;
  return { lead, accent: rest.join(" ") };
}

const BRANCH_LOGO = staticAssetUrl("/assets/brand/logo.webp");
const SCROLL_STEP_FALLBACK_PX = 260;
const SCROLL_EDGE_TOLERANCE_PX = 1;

function readScrollStepPx(scroller: HTMLElement): number {
  const firstItem = scroller.querySelector("li");
  if (!(firstItem instanceof HTMLElement)) return SCROLL_STEP_FALLBACK_PX;

  const gapValue = Number.parseFloat(getComputedStyle(scroller).gap);
  const gap = Number.isFinite(gapValue) ? gapValue : 0;
  return firstItem.offsetWidth + gap;
}

function BranchArrow({
  direction,
  label,
  revealed,
  onClick,
}: {
  direction: -1 | 1;
  label: string;
  revealed: boolean;
  onClick: () => void;
}) {
  const Icon = direction === -1 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`${ARROW_BUTTON_CLASS} ${branchAppearClass(revealed)}`}
      style={branchAppearStyle(1)}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function BranchScroller({
  branches,
  previousLabel,
  nextLabel,
  revealed,
}: {
  branches: readonly HomeBranchItem[];
  previousLabel: string;
  nextLabel: string;
  revealed: boolean;
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
        <BranchArrow
          direction={-1}
          label={previousLabel}
          revealed={revealed}
          onClick={() => scrollByDirection(-1)}
        />
      ) : null}
      <ul
        ref={scrollerRef}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-x-hidden"
      >
        {branches.map((branch, index) => (
          <li
            key={branch.id}
            className="w-[210px] shrink-0 snap-start md:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-4rem)/5)]"
          >
            <BranchCard
              branch={branch}
              appearIndex={index + 1}
              appearActive={revealed}
            />
          </li>
        ))}
      </ul>
      {showArrows ? (
        <BranchArrow
          direction={1}
          label={nextLabel}
          revealed={revealed}
          onClick={() => scrollByDirection(1)}
        />
      ) : null}
    </div>
  );
}

function BranchCard({
  branch,
  appearIndex,
  appearActive,
}: {
  branch: HomeBranchItem;
  appearIndex: number;
  appearActive: boolean;
}) {
  return (
    <AppLink
      href={branch.href}
      prefetchPolicy="intent"
      className={`flex h-full flex-col overflow-hidden rounded-[20px] bg-brand-red text-white ${branchAppearClass(appearActive)}`}
      style={branchAppearStyle(appearIndex)}
    >
      <div className="relative h-[155px] w-full shrink-0 overflow-hidden rounded-[20px] bg-white">
        {branch.imageUrl ? (
          <Image
            src={branch.imageUrl}
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
  const { sectionRef, revealed } = useViewportReveal();
  const { lead, accent } = splitSecondWordAccent(title);

  if (branches.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden bg-white py-6 md:py-10 lg:py-12"
    >
      <div className="page-container">
        <div
          className={`mb-5 flex items-center justify-between gap-3 md:mb-8 ${branchAppearClass(revealed)}`}
          style={branchAppearStyle(0)}
        >
          <h2 className="min-w-0 truncate text-[20px] leading-tight font-black text-[#171717] uppercase md:text-[26px] lg:text-[30px]">
            {lead}
            {accent ? (
              <>
                {" "}
                <span className="text-brand-red-hot">{accent}</span>
              </>
            ) : null}
          </h2>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="hidden shrink-0 items-center gap-1 text-sm font-bold text-brand-red uppercase md:inline-flex"
          >
            {viewAllLabel}
            <ChevronRight className="size-4" aria-hidden />
          </AppLink>
        </div>

        <BranchScroller
          branches={branches}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          revealed={revealed}
        />
      </div>
    </section>
  );
}
