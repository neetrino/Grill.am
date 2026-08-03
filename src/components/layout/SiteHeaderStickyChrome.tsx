"use client";

import { useEffect, useRef, useState } from "react";

type SiteHeaderStickyChromeProps = {
  primary: React.ReactNode;
  secondary: React.ReactNode;
};

const TOP_REVEAL_Y = 24;
const DIRECTION_DELTA = 10;
const DESKTOP_MIN_WIDTH = 768;

/**
 * Sticky header chrome: secondary bar always stays; primary bar hides on
 * scroll-down and returns on scroll-up (Mobee-style) from md+.
 */
export function SiteHeaderStickyChrome({
  primary,
  secondary,
}: SiteHeaderStickyChromeProps) {
  const [primaryHidden, setPrimaryHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function onScroll(): void {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) {
        setPrimaryHidden(false);
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const y = window.scrollY;
      const lastY = lastScrollYRef.current;
      const delta = y - lastY;

      if (y <= TOP_REVEAL_Y) {
        setPrimaryHidden(false);
      } else if (delta > DIRECTION_DELTA) {
        setPrimaryHidden(true);
      } else if (delta < -DIRECTION_DELTA) {
        setPrimaryHidden(false);
      }

      lastScrollYRef.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          primaryHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
        aria-hidden={primaryHidden}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`origin-top transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              primaryHidden
                ? "pointer-events-none -translate-y-3 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            {primary}
          </div>
        </div>
      </div>
      {secondary}
    </div>
  );
}
