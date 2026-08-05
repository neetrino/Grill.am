"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { isLocale } from "@/lib/i18n/config";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

const SURFACE_WHITE = "#ffffff";
const SURFACE_GRAY = "#f2f0f0";
/** Matches footer `lg:block` / bottom nav `lg:hidden`. */
const DESKTOP_CHROME_MQ = "(min-width: 1024px)";

/** White page wash on home + marketing pages — matches content and mobile bottom gap. */
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
  return page === "about" || page === "contact" || page === "stores";
}

/**
 * Mobile: surface matches the page (white or gray) behind the bottom nav.
 * Desktop (`lg+`): always white so rounded footer corner reveals stay white.
 * Gray shop/profile bands still paint their own full-bleed roots.
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  const pathname = usePathname() ?? "";
  const isWhitePage = isWhiteSurfacePath(pathname);
  const mobileSurface = isWhitePage ? SURFACE_WHITE : SURFACE_GRAY;

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    const mq = window.matchMedia(DESKTOP_CHROME_MQ);

    function syncBody(): void {
      document.body.style.backgroundColor = mq.matches
        ? SURFACE_WHITE
        : mobileSurface;
    }

    syncBody();
    mq.addEventListener("change", syncBody);
    return () => {
      mq.removeEventListener("change", syncBody);
      document.body.style.backgroundColor = previous;
    };
  }, [mobileSurface]);

  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col overflow-x-clip bg-white ${
        isWhitePage ? "" : "max-lg:bg-[#f2f0f0]"
      }`}
    >
      {children}
    </div>
  );
}
