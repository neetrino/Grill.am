"use client";

import { ShoppingBag } from "lucide-react";

import {
  PROFILE_CARD_FLAT_CLASS,
  PROFILE_ICON_TONE,
  PROFILE_PENDING_BADGE_CLASS,
} from "@/features/profile/ui/profile-ui";

type ProfileRecentOrderCardProps = {
  orderNumber: string;
  status: string;
  totalLabel: string;
  metaLine: string;
  placedOnLine: string;
  orderNumberLabel: string;
  viewDetailsLabel: string;
  onViewDetails: () => void;
};

export function ProfileRecentOrderCard({
  orderNumber,
  status,
  totalLabel,
  metaLine,
  placedOnLine,
  orderNumberLabel,
  viewDetailsLabel,
  onViewDetails,
}: ProfileRecentOrderCardProps) {
  return (
    <button
      type="button"
      onClick={onViewDetails}
      className={`flex h-full w-full flex-col p-4 text-left transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 ${PROFILE_CARD_FLAT_CLASS} border border-gray-100`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-bold text-gray-900">
          {orderNumberLabel} {orderNumber}
        </h3>
        <span className={`${PROFILE_PENDING_BADGE_CLASS} shrink-0`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-lg leading-none font-bold text-gray-900 sm:text-xl">
        {totalLabel}
      </p>

      <div className="my-4 border-t border-dashed border-gray-200" aria-hidden />

      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: PROFILE_ICON_TONE.background,
            color: PROFILE_ICON_TONE.foreground,
          }}
        >
          <ShoppingBag className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5 text-sm leading-relaxed text-gray-600">
          <p>{metaLine}</p>
          <p>{placedOnLine}</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <span className="flex min-h-9 w-full items-center justify-between rounded-full bg-brand-red py-0.5 pr-0.5 pl-4 text-xs font-medium text-white">
          <span className="flex-1 text-center">{viewDetailsLabel}</span>
          <span className="flex h-7 w-7 shrink-0 -translate-x-0.5 items-center justify-center rounded-full bg-white text-brand-red">
            →
          </span>
        </span>
      </div>
    </button>
  );
}
