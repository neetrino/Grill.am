"use client";

import { useEffect, type RefObject } from "react";

/**
 * When a desktop overflow container cannot scroll further (or has no overflow),
 * forward wheel/trackpad deltas to the page so the footer can be reached.
 */
export function useProfilePageScrollChain(
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === "undefined") {
      return;
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function onWheel(event: WheelEvent): void {
      if (!desktopQuery.matches) {
        return;
      }

      const el = ref.current;
      if (!el || event.ctrlKey) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop >= maxScroll - 1;

      if (maxScroll <= 0) {
        window.scrollBy({ top: event.deltaY, left: 0 });
        event.preventDefault();
        return;
      }

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        window.scrollBy({ top: event.deltaY, left: 0 });
        event.preventDefault();
      }
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
    };
  }, [ref]);
}
