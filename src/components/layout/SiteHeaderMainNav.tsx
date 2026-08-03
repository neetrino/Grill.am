"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { HeaderLocaleCurrencyPill } from "@/components/layout/HeaderLocaleCurrencyPill";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { StoreAddressDropdown } from "@/components/layout/StoreAddressDropdown";
import { StorePhoneDropdown } from "@/components/layout/StorePhoneDropdown";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type NavItem = {
  href: string;
  label: string;
};

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  navItems: readonly NavItem[];
  mobileNav: React.ReactNode;
  desktopActions: React.ReactNode;
};

const TOP_REVEAL_Y = 24;
const DIRECTION_DELTA = 10;
/** Instant sync — scroll restore / route jumps, not user wheel. */
const SCROLL_JUMP_DELTA = 80;
const DESKTOP_MIN_WIDTH = 768;
const HIDDEN_STATE_STORAGE_PREFIX = "grill:header-primary-hidden:";

function readShouldHidePrimary(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.innerWidth < DESKTOP_MIN_WIDTH) {
    return false;
  }
  return window.scrollY > TOP_REVEAL_Y;
}

function readStoredHidden(pathname: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(`${HIDDEN_STATE_STORAGE_PREFIX}${pathname}`);
    if (raw === "1") {
      return true;
    }
    if (raw === "0") {
      return false;
    }
  } catch {
    // sessionStorage may be unavailable
  }
  return null;
}

function writeStoredHidden(pathname: string, hidden: boolean): void {
  try {
    sessionStorage.setItem(
      `${HIDDEN_STATE_STORAGE_PREFIX}${pathname}`,
      hidden ? "1" : "0",
    );
  } catch {
    // sessionStorage may be unavailable
  }
}

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

export function SiteHeaderMainNav({
  locale,
  currency,
  dictionary,
  navItems,
  mobileNav,
  desktopActions,
}: SiteHeaderMainNavProps) {
  const searchLabels = headerSearchLabels(dictionary);
  const pathname = usePathname();
  const homeHref = `/${locale}`;
  const isHomePage = pathname === homeHref || pathname === `${homeHref}/`;

  // Always start expanded so SSR HTML matches the first client render.
  // Scroll/collapse is applied in useLayoutEffect before paint.
  const [primaryHidden, setPrimaryHidden] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const lastScrollYRef = useRef(0);
  const primaryHiddenRef = useRef(false);
  const motionEnabledRef = useRef(false);
  const motionEnableTimerRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  const routeSyncTimerRef = useRef<number | null>(null);
  const isPopNavigationRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);

  function clearMotionEnableTimer(): void {
    if (motionEnableTimerRef.current != null) {
      window.clearTimeout(motionEnableTimerRef.current);
      motionEnableTimerRef.current = null;
    }
  }

  function clearRouteSyncTimer(): void {
    if (routeSyncTimerRef.current != null) {
      window.clearTimeout(routeSyncTimerRef.current);
      routeSyncTimerRef.current = null;
    }
  }

  function clearProgrammaticScrollTimer(): void {
    if (programmaticScrollTimerRef.current != null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }

  function scheduleMotionEnable(): void {
    clearMotionEnableTimer();
    motionEnableTimerRef.current = window.setTimeout(() => {
      motionEnabledRef.current = true;
      setMotionEnabled(true);
      motionEnableTimerRef.current = null;
    }, 50);
  }

  function setHiddenState(nextHidden: boolean, animate: boolean): void {
    if (primaryHiddenRef.current === nextHidden) {
      return;
    }

    if (!animate) {
      clearMotionEnableTimer();
      motionEnabledRef.current = false;
      setMotionEnabled(false);
    }

    primaryHiddenRef.current = nextHidden;
    setPrimaryHidden(nextHidden);
    writeStoredHidden(pathnameRef.current, nextHidden);

    if (!animate && !programmaticScrollRef.current) {
      scheduleMotionEnable();
    }
  }

  function unlockProgrammaticScroll(): void {
    clearProgrammaticScrollTimer();
    programmaticScrollRef.current = false;
    lastScrollYRef.current = window.scrollY;
    setScrollLocked(false);
    scheduleMotionEnable();
  }

  function scrollHomeToTop(): void {
    clearProgrammaticScrollTimer();
    clearMotionEnableTimer();

    programmaticScrollRef.current = true;
    setScrollLocked(true);
    motionEnabledRef.current = false;
    setMotionEnabled(false);

    // Expand primary instantly with transitions forced off.
    if (primaryHiddenRef.current) {
      primaryHiddenRef.current = false;
      setPrimaryHidden(false);
      writeStoredHidden(pathnameRef.current, false);
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
    // Fallback when scrollend is unavailable.
    programmaticScrollTimerRef.current = window.setTimeout(() => {
      window.removeEventListener("scrollend", onScrollEnd);
      unlockProgrammaticScroll();
    }, 1200);
  }

  useEffect(() => {
    function onPopState(): void {
      isPopNavigationRef.current = true;
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    pathnameRef.current = pathname;
    clearRouteSyncTimer();

    const isPop = isPopNavigationRef.current;
    isPopNavigationRef.current = false;

    if (isPop) {
      // Back/forward: wait for scroll restoration, then match header to it.
      const stored = readStoredHidden(pathname);
      const y = window.scrollY;
      if (stored === true && y <= TOP_REVEAL_Y) {
        setHiddenState(true, false);
        routeSyncTimerRef.current = window.setTimeout(() => {
          lastScrollYRef.current = window.scrollY;
          setHiddenState(readShouldHidePrimary(), false);
          routeSyncTimerRef.current = null;
        }, 120);
      } else {
        lastScrollYRef.current = window.scrollY;
        setHiddenState(readShouldHidePrimary(), false);
      }
    } else {
      // Forward navigation lands at top — primary bar must be visible.
      lastScrollYRef.current = 0;
      setHiddenState(false, false);
    }

    return () => {
      clearMotionEnableTimer();
      clearRouteSyncTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional pathname gate
  }, [pathname]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function onScroll(): void {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) {
        if (primaryHiddenRef.current) {
          setHiddenState(false, false);
        }
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const y = window.scrollY;

      // Logo smooth-scroll — freeze chrome; ignore hide/jump until unlock.
      if (programmaticScrollRef.current) {
        lastScrollYRef.current = y;
        return;
      }

      const delta = y - lastScrollYRef.current;

      if (Math.abs(delta) >= SCROLL_JUMP_DELTA) {
        lastScrollYRef.current = y;
        setHiddenState(y > TOP_REVEAL_Y, false);
        return;
      }

      let nextHidden = primaryHiddenRef.current;

      if (y <= TOP_REVEAL_Y) {
        nextHidden = false;
      } else if (delta > DIRECTION_DELTA) {
        nextHidden = true;
      } else if (delta < -DIRECTION_DELTA) {
        nextHidden = false;
      }

      lastScrollYRef.current = y;
      setHiddenState(nextHidden, motionEnabledRef.current);
    }

    function onPageShow(event: PageTransitionEvent): void {
      if (!event.persisted) {
        return;
      }
      lastScrollYRef.current = window.scrollY;
      setHiddenState(readShouldHidePrimary(), false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pageshow", onPageShow);
      clearMotionEnableTimer();
      clearRouteSyncTimer();
      clearProgrammaticScrollTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listeners once; refs hold latest
  }, []);

  const allowMotion = motionEnabled && !scrollLocked;
  const collapseTransitionClass = allowMotion
    ? "transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    : "transition-none";
  const fadeTransitionClass = allowMotion
    ? "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    : "transition-none";

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div
        className={`grid ${collapseTransitionClass} ${
          primaryHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
        aria-hidden={primaryHidden}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`origin-top ${fadeTransitionClass} ${
              primaryHidden
                ? "pointer-events-none -translate-y-3 opacity-0"
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
                    {navItems.map((item, index) => (
                      <AppLink
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        prefetchPolicy="intent"
                        className={`rounded-[10px] px-4 py-2 text-base font-semibold whitespace-nowrap transition ${
                          index === 0
                            ? "text-brand-red"
                            : "text-[#101010] hover:text-brand-red"
                        }`}
                      >
                        {item.label}
                      </AppLink>
                    ))}
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
