"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageEnter } from "@/components/ui/PageEnter";

type StorefrontPageEnterProps = {
  children: ReactNode;
};

const SLOW_ENTER_SEGMENTS = new Set(["about", "careers", "contact"]);

function usesSlowEnter(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegment = segments[1];
  return routeSegment != null && SLOW_ENTER_SEGMENTS.has(routeSegment);
}

/**
 * Page enter for storefront routes. About / careers / contact use a slower,
 * softer rise so content-heavy pages feel calmer.
 */
export function StorefrontPageEnter({ children }: StorefrontPageEnterProps) {
  const pathname = usePathname();
  const slow = usesSlowEnter(pathname);

  return (
    <PageEnter className={slow ? "page-enter--slow" : undefined}>
      {children}
    </PageEnter>
  );
}
