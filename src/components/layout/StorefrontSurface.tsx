"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { isLocale } from "@/lib/i18n/config";
import { isAuthSurfacePath } from "@/lib/routes/auth-surface-path";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

const SURFACE_WHITE = "#ffffff";
const SURFACE_GRAY = "#f2f0f0";
/** Matches footer `lg:block` / bottom nav `lg:hidden`; mirrors `--breakpoint-lg`. */
const DESKTOP_CHROME_MQ = "(min-width: 1025px)";

const SURFACE_AUTH = "#E3181D";

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
  return (
    page === "about" ||
    page === "contact" ||
    page === "stores" ||
    page === "careers"
  );
}

/**
 * Mobile: surface matches the page (white or gray) behind the bottom nav.
 * Desktop (`lg+`): always white so rounded footer corner reveals stay white.
 * Gray shop/profile bands still paint their own full-bleed roots.
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  const pathname = usePathname() ?? "";
  const isWhitePage = isWhiteSurfacePath(pathname);
  const isAuthPage = isAuthSurfacePath(pathname);
  const mobileSurface = isWhitePage ? SURFACE_WHITE : SURFACE_GRAY;

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    const mq = window.matchMedia(DESKTOP_CHROME_MQ);

    function syncBody(): void {
      if (isAuthPage) {
        document.documentElement.style.backgroundColor = SURFACE_AUTH;
        document.body.style.backgroundColor = SURFACE_AUTH;
        document.documentElement.classList.add("auth-page-active");
        document.body.classList.add("auth-page-active");
        return;
      }
      document.documentElement.classList.remove("auth-page-active");
      document.body.classList.remove("auth-page-active");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = mq.matches
        ? SURFACE_WHITE
        : mobileSurface;
    }

    syncBody();
    mq.addEventListener("change", syncBody);
    return () => {
      mq.removeEventListener("change", syncBody);
      document.documentElement.classList.remove("auth-page-active");
      document.body.classList.remove("auth-page-active");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = previous;
    };
  }, [isAuthPage, mobileSurface]);

  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col ${
        isAuthPage
          ? "relative z-[2] overflow-x-visible bg-[#E3181D]"
          : `overflow-x-clip bg-white ${isWhitePage ? "" : "max-lg:bg-[#f2f0f0]"}`
      }`}
    >
      {isAuthPage ? (
        <div
          data-auth-stage-root
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}
