"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { DesktopFluidFrame } from "@/components/layout/DesktopFluidFrame";
import { isLocale } from "@/lib/i18n/config";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

const SURFACE_WHITE = "#ffffff";
const SURFACE_GRAY = "#f2f0f0";
/** Matches footer `md:block` / bottom nav `md:hidden`. */
const DESKTOP_CHROME_MQ = "(min-width: 768px)";

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
  return page === "about" || page === "contact";
}

function isStoresPath(pathname: string): boolean {
  return /\/stores(?:\/|$)/.test(pathname);
}

/**
 * Mobile: surface matches the page (white or gray) behind the bottom nav.
 * Desktop (`md+`): white by default so rounded footer corner reveals stay white.
 * Stores keeps a full gray wash (like about/contact white) so short iPad layouts
 * do not show a white gap above the footer.
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  const pathname = usePathname() ?? "";
  const isWhitePage = isWhiteSurfacePath(pathname);
  const isStoresPage = isStoresPath(pathname);
  const mobileSurface = isWhitePage ? SURFACE_WHITE : SURFACE_GRAY;

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    const mq = window.matchMedia(DESKTOP_CHROME_MQ);

    function syncBody(): void {
      if (mq.matches) {
        document.body.style.backgroundColor = isStoresPage
          ? SURFACE_GRAY
          : SURFACE_WHITE;
        return;
      }
      document.body.style.backgroundColor = mobileSurface;
    }

    syncBody();
    mq.addEventListener("change", syncBody);
    return () => {
      mq.removeEventListener("change", syncBody);
      document.body.style.backgroundColor = previous;
    };
  }, [isStoresPage, mobileSurface]);

  const surfaceClass = isStoresPage
    ? "bg-[#f2f0f0]"
    : isWhitePage
      ? "bg-white"
      : "bg-white max-md:bg-[#f2f0f0]";

  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col overflow-x-clip ${surfaceClass}`}
    >
      <DesktopFluidFrame
        className={`flex min-h-dvh flex-1 flex-col ${
          isStoresPage ? "bg-[#f2f0f0]" : ""
        }`}
      >
        {children}
      </DesktopFluidFrame>
    </div>
  );
}
