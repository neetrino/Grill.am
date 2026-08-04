"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { isLocale } from "@/lib/i18n/config";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

/** White page wash (home + full-bleed white pages) — matches footer corner reveal. */
function isWhiteSurfacePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] ?? "";
  if (!isLocale(locale)) {
    return false;
  }
  const page = parts[1];
  if (page == null) {
    return true;
  }
  return page === "about" || page === "contact";
}

/**
 * Page surface + body background — white on home/about/contact, gray elsewhere —
 * so under-navbar and above-footer areas always match the page.
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  const pathname = usePathname() ?? "";
  const isWhite = isWhiteSurfacePath(pathname);
  const surface = isWhite ? "#ffffff" : "#f2f0f0";

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = surface;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [surface]);

  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col overflow-x-clip ${
        isWhite ? "bg-white" : "bg-[#f2f0f0]"
      }`}
    >
      {children}
    </div>
  );
}
