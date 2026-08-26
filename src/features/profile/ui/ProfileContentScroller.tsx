"use client";

import { useRef, type ReactNode } from "react";

import { PROFILE_STICKY_BAND_CLASS } from "@/features/profile/ui/profile-ui";
import { useProfilePageScrollChain } from "@/features/profile/ui/use-profile-page-scroll-chain";

type ProfileContentScrollerProps = {
  children: ReactNode;
};

/**
 * Desktop profile content column: scrolls inside the sticky band, then
 * chains wheel/trackpad input to the page so the footer can be reached
 * (Kamancha profile behavior).
 */
export function ProfileContentScroller({
  children,
}: ProfileContentScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useProfilePageScrollChain(ref);

  return (
    <div
      ref={ref}
      className={`min-h-0 min-w-0 overflow-visible lg:overflow-y-auto lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden ${PROFILE_STICKY_BAND_CLASS}`}
    >
      {children}
    </div>
  );
}
