"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Scroll to top on forward/replace navigations. Back/forward keep browser restore.
 * Same-pathname effect re-runs (React Strict Mode) must not scroll to top on refresh.
 */
export function StorefrontScrollToTop() {
  const pathname = usePathname();
  const isPopNavigationRef = useRef(false);
  /** null until first effect; equal pathname = mount/Strict re-run, not a route change. */
  const syncedPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    function onPopState(): void {
      isPopNavigationRef.current = true;
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const previous = syncedPathnameRef.current;
    syncedPathnameRef.current = pathname;

    if (previous === null || previous === pathname) {
      isPopNavigationRef.current = false;
      return;
    }

    if (isPopNavigationRef.current) {
      isPopNavigationRef.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
