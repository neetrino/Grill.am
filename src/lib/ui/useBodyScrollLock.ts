"use client";

import { useEffect } from "react";

import { lockBodyScroll, unlockBodyScroll } from "@/lib/ui/body-scroll-lock";

/** Prevents background page scroll while a modal, drawer, or sheet is open. */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
