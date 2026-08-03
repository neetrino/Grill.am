"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Scroll to top on forward/replace navigations. Back/forward keep browser restore.
 */
export function StorefrontScrollToTop() {
  const pathname = usePathname();
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    function onPopState(): void {
      isPopNavigationRef.current = true;
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    if (isPopNavigationRef.current) {
      isPopNavigationRef.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
