"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { HeaderLocaleCurrencyPill } from "@/components/layout/HeaderLocaleCurrencyPill";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { PrimaryNavLinks } from "@/components/layout/PrimaryNavLinks";
import { StoreAddressDropdown } from "@/components/layout/StoreAddressDropdown";
import { StorePhoneDropdown } from "@/components/layout/StorePhoneDropdown";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
  mobileNav: React.ReactNode;
  desktopActions: React.ReactNode;
};

const TOP_REVEAL_Y = 8;
/** Scroll down past this → close primary. */
const HIDE_DELTA = 14;
/** Scroll up past this → open primary. */
const SHOW_DELTA = 14;
const DESKTOP_MIN_WIDTH = 768;
/** Ignore opposite direction while the open/close animation runs. */
const TOGGLE_LOCK_MS = 420;
/** Live sticky header height for catalog sidebars and other sticky rails. */
const STOREFRONT_HEADER_OFFSET_VAR = "--storefront-header-offset";

function headerSearchLabels(dictionary: Dictionary) {
  return {
    search: dictionary.header.search,
    searchPlaceholder: dictionary.header.searchPlaceholder,
    searchNoResults: dictionary.header.searchNoResults,
    searchViewAll: dictionary.header.searchViewAll,
    searchHint: dictionary.header.searchHint,
    close: dictionary.close,
  };
}

/**
 * Primary nav hide-on-scroll.
 *
 * Design choices (after flicker regressions):
 * - Refresh always starts open (no restore-collapse).
 * - No scrollY compensation (it fought the user scroll and caused strong flicker).
 * - No gesture settle / majority voting (double-fired with scrollend).
 * - After each toggle, lock direction changes for TOGGLE_LOCK_MS.
 * - overflow-anchor: none reduces browser scroll-anchoring jumps when height changes.
 */
export function SiteHeaderMainNav({
  locale,
  currency,
  dictionary,
  navItems,
  categories,
  mobileNav,
  desktopActions,
}: SiteHeaderMainNavProps) {
  const searchLabels = headerSearchLabels(dictionary);
  const pathname = usePathname();
  const homeHref = `/${locale}`;
  const isHomePage = pathname === homeHref || pathname === `${homeHref}/`;

  const [primaryHidden, setPrimaryHidden] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [routePathname, setRoutePathname] = useState(pathname);
  const [scrollLocked, setScrollLocked] = useState(false);

  const headerRootRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const primaryHiddenRef = useRef(false);
  const motionEnabledRef = useRef(false);
  const toggleLockUntilRef = useRef(0);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const motionEnableTimerRef = useRef<number | null>(null);

  if (routePathname !== pathname) {
    setRoutePathname(pathname);
    setPrimaryHidden(false);
    setMotionEnabled(false);
  }

  function clearProgrammaticScrollTimer(): void {
    if (programmaticScrollTimerRef.current != null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }

  function clearMotionEnableTimer(): void {
    if (motionEnableTimerRef.current != null) {
      window.clearTimeout(motionEnableTimerRef.current);
      motionEnableTimerRef.current = null;
    }
  }

  function armMotion(): void {
    clearMotionEnableTimer();
    motionEnableTimerRef.current = window.setTimeout(() => {
      motionEnabledRef.current = true;
      setMotionEnabled(true);
      motionEnableTimerRef.current = null;
    }, 50);
  }

  function setPrimaryHiddenState(nextHidden: boolean, animate: boolean): void {
    if (primaryHiddenRef.current === nextHidden) {
      return;
    }

    if (!animate) {
      clearMotionEnableTimer();
      motionEnabledRef.current = false;
      setMotionEnabled(false);
    } else if (!motionEnabledRef.current) {
      motionEnabledRef.current = true;
      setMotionEnabled(true);
    }

    primaryHiddenRef.current = nextHidden;
    setPrimaryHidden(nextHidden);
    toggleLockUntilRef.current = Date.now() + TOGGLE_LOCK_MS;

    if (!animate) {
      armMotion();
    }
  }

  function unlockProgrammaticScroll(): void {
    clearProgrammaticScrollTimer();
    programmaticScrollRef.current = false;
    lastScrollYRef.current = window.scrollY;
    setScrollLocked(false);
    armMotion();
  }

  function scrollHomeToTop(): void {
    clearProgrammaticScrollTimer();
    clearMotionEnableTimer();

    programmaticScrollRef.current = true;
    setScrollLocked(true);
    motionEnabledRef.current = false;
    setMotionEnabled(false);

    if (primaryHiddenRef.current) {
      primaryHiddenRef.current = false;
      setPrimaryHidden(false);
    }

    if (window.scrollY <= TOP_REVEAL_Y) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      programmaticScrollTimerRef.current = window.setTimeout(() => {
        unlockProgrammaticScroll();
      }, 100);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    function onScrollEnd(): void {
      window.removeEventListener("scrollend", onScrollEnd);
      clearProgrammaticScrollTimer();
      programmaticScrollTimerRef.current = window.setTimeout(() => {
        unlockProgrammaticScroll();
      }, 120);
    }

    window.addEventListener("scrollend", onScrollEnd, { once: true });
    programmaticScrollTimerRef.current = window.setTimeout(() => {
      window.removeEventListener("scrollend", onScrollEnd);
      unlockProgrammaticScroll();
    }, 1200);
  }

  useLayoutEffect(() => {
    primaryHiddenRef.current = primaryHidden;
    motionEnabledRef.current = motionEnabled;
  }, [primaryHidden, motionEnabled]);

  useLayoutEffect(() => {
    const headerRoot = headerRootRef.current;
    if (!headerRoot) {
      return;
    }

    function publishHeaderOffset(): void {
      const el = headerRootRef.current;
      if (!el) {
        return;
      }
      const height = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        STOREFRONT_HEADER_OFFSET_VAR,
        `${height}px`,
      );
    }

    publishHeaderOffset();
    const observer = new ResizeObserver(publishHeaderOffset);
    observer.observe(headerRoot);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(STOREFRONT_HEADER_OFFSET_VAR);
    };
  }, []);

  useLayoutEffect(() => {
    lastScrollYRef.current = window.scrollY;
    primaryHiddenRef.current = false;
    toggleLockUntilRef.current = 0;
    armMotion();
    return () => {
      clearMotionEnableTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route entry only
  }, [pathname]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function onScroll(): void {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) {
        if (primaryHiddenRef.current) {
          setPrimaryHiddenState(false, false);
        }
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const y = window.scrollY;

      if (programmaticScrollRef.current) {
        lastScrollYRef.current = y;
        return;
      }

      const delta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (y <= TOP_REVEAL_Y) {
        setPrimaryHiddenState(false, motionEnabledRef.current);
        return;
      }

      // While animating a previous toggle, only track position — no reverse flicker.
      if (Date.now() < toggleLockUntilRef.current) {
        return;
      }

      if (delta >= HIDE_DELTA) {
        setPrimaryHiddenState(true, true);
      } else if (delta <= -SHOW_DELTA) {
        setPrimaryHiddenState(false, true);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearMotionEnableTimer();
      clearProgrammaticScrollTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listeners once; refs hold latest
  }, []);

  const allowMotion = motionEnabled && !scrollLocked;
  const motionClass = allowMotion
    ? "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    : "duration-0";

  return (
    <div
      ref={headerRootRef}
      data-site-header
      className="sticky top-0 z-50 bg-white [overflow-anchor:none]"
    >
      <div
        className={`grid transition-[grid-template-rows] ${motionClass} ${
          primaryHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
        aria-hidden={primaryHidden}
      >
        <div className="min-h-0 overflow-hidden [overflow-anchor:none]">
          <div
            className={`origin-top transition-[opacity,transform] ${motionClass} ${
              primaryHidden
                ? "pointer-events-none -translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <header className="bg-white">
              <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/7 py-3">
                  <div className="flex items-center gap-3">
                    <AppLink
                      href={homeHref}
                      prefetchPolicy="intent"
                      className="relative block h-9 w-[92px] shrink-0"
                      onClick={(event) => {
                        if (!isHomePage) {
                          return;
                        }
                        event.preventDefault();
                        scrollHomeToTop();
                      }}
                    >
                      <Image
                        src="/assets/brand/logo.webp"
                        alt={dictionary.brand}
                        fill
                        sizes="92px"
                        className="object-contain"
                        priority
                      />
                    </AppLink>

                    <div className="flex items-center gap-1 md:hidden">
                      <HeaderSearch
                        locale={locale}
                        currency={currency}
                        labels={searchLabels}
                      />
                      {mobileNav}
                    </div>
                  </div>

                  <nav
                    aria-label="Primary"
                    className="order-3 hidden w-full items-center justify-center gap-0.5 lg:order-none lg:flex lg:w-auto lg:flex-1"
                  >
                    <PrimaryNavLinks
                      locale={locale}
                      navItems={navItems}
                      categories={categories}
                      allCategoriesLabel={dictionary.nav.allCategories}
                      onHomeActiveClick={scrollHomeToTop}
                    />
                  </nav>

                  <div className="hidden items-center gap-6 text-base font-medium text-[#333] md:flex">
                    <StorePhoneDropdown
                      phones={dictionary.contact.storePhones}
                      toggleLabel={dictionary.contact.callTitle}
                      variant="header"
                    />
                    <StoreAddressDropdown
                      addresses={dictionary.contact.storeAddresses}
                      toggleLabel={dictionary.footer.addresses}
                      variant="header"
                    />
                  </div>
                </div>
              </div>
            </header>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-black/7 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] md:block">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <div className="min-w-0 flex-1">
            <HeaderSearch
              locale={locale}
              currency={currency}
              labels={searchLabels}
              showLabel
              triggerClassName="flex h-[49px] w-full items-center gap-2 rounded-full bg-brand-surface px-8 text-sm text-[rgba(33,43,54,0.46)] transition hover:bg-[#ececec]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {desktopActions}
            <HeaderLocaleCurrencyPill
              locale={locale}
              currency={currency}
              languageLabel={dictionary.header.language}
              currencyLabel={dictionary.header.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
