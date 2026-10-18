"use client";

import type { ReactNode } from "react";
import { ChevronRight, ShoppingCart } from "lucide-react";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import { AppLink } from "@/components/ui/AppLink";

export type CheckoutGrillCoinProgressCopy = {
  title: string;
  hint: string;
  cta: string;
};

type CheckoutGrillCoinProgressProps = {
  productsHref: string;
  targetFormatted: string;
  progressRatio: number;
  copy: CheckoutGrillCoinProgressCopy;
};

function titleWithHighlightedAmount(
  title: string,
  amountFormatted: string,
): ReactNode {
  const amountIdx = title.indexOf(amountFormatted);
  if (amountIdx === -1) {
    return title;
  }
  return (
    <>
      {title.slice(0, amountIdx)}
      <span className="font-bold text-[#E08900]">{amountFormatted}</span>
      {title.slice(amountIdx + amountFormatted.length)}
    </>
  );
}

/**
 * Cream progress card — merchandise total vs Grill Coin earn floor.
 */
export function CheckoutGrillCoinProgress({
  productsHref,
  targetFormatted,
  progressRatio,
  copy,
}: CheckoutGrillCoinProgressProps) {
  const clamped = Math.min(1, Math.max(0, progressRatio));
  const percent = Math.round(clamped * 100);

  return (
    <div className="rounded-[15px] border border-[#F0C57A] bg-[#FFF6E8] px-3.5 py-3">
      <div className="flex items-start gap-2">
        <HeaderCoinsIcon className="mt-0.5 size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-[#5C3D14]">
            {titleWithHighlightedAmount(copy.title, targetFormatted)}
          </p>

          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F7E0B8]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="h-full rounded-full bg-[#FFB020] transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="mt-1.5 text-[11px] leading-snug text-[#7A5A32]">
            {copy.hint}
          </p>
        </div>
      </div>

      <AppLink
        href={productsHref}
        prefetchPolicy="intent"
        className="mt-2.5 flex items-center gap-2 rounded-full border border-[#F0C57A] bg-white px-2.5 py-1.5 transition hover:bg-[#FFFBF3]"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FFB020] text-white">
          <ShoppingCart className="size-3" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-xs font-semibold leading-snug text-[#E08900]">
          {copy.cta}
        </span>
        <ChevronRight
          className="size-3.5 shrink-0 text-[#E08900]"
          aria-hidden
        />
      </AppLink>
    </div>
  );
}
