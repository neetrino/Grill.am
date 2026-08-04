"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { isLocale } from "@/lib/i18n/config";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

function isHomePath(pathname: string): boolean {
  const segment = pathname.split("/")[1] ?? "";
  if (!isLocale(segment)) {
    return false;
  }
  return pathname === `/${segment}` || pathname === `/${segment}/`;
}

/**
 * Page surface + body background — white on home, gray elsewhere —
 * so under-navbar areas always match the page (works across client navigations).
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  const pathname = usePathname() ?? "";
  const isHome = isHomePath(pathname);
  const surface = isHome ? "#ffffff" : "#f2f0f0";

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = surface;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [surface]);

  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col ${
        isHome ? "bg-white" : "bg-[#f2f0f0]"
      }`}
    >
      {children}
    </div>
  );
}
