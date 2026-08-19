"use client";

import { useEffect, type RefObject } from "react";

/**
 * Horizontal card rows are scroll containers, so the wheel often dies on them.
 * Forward vertical intent to the page so hover/touch over cards still scrolls.
 */
export function useForwardVerticalWheelToPage(
  scrollerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    function onWheel(event: WheelEvent): void {
      if (event.ctrlKey || event.deltaY === 0) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();
      window.scrollBy({ top: event.deltaY, left: 0 });
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [scrollerRef]);
}
