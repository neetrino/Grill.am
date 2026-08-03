"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartTrigger } from "@/components/layout/HeaderCartTrigger";
import { HeaderLocaleCurrencyPill } from "@/components/layout/HeaderLocaleCurrencyPill";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { StoreAddressDropdown } from "@/components/layout/StoreAddressDropdown";
import { StorePhoneDropdown } from "@/components/layout/StorePhoneDropdown";
import { AppLink } from "@/components/ui/AppLink";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
};

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly NavItem[];
  cartItemCount: number;
  wishlistCount: number;
};

const TOP_REVEAL_Y = 24;
const DIRECTION_DELTA = 10;
const DESKTOP_MIN_WIDTH = 768;

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
  user,
  navItems,
  cartItemCount,
  wishlistCount,
}: SiteHeaderMainNavProps) {
  const searchLabels = headerSearchLabels(dictionary);
  const [primaryHidden, setPrimaryHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const primaryHiddenRef = useRef(false);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function onScroll(): void {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) {
        if (primaryHiddenRef.current) {
          primaryHiddenRef.current = false;
          setPrimaryHidden(false);
        }
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;
      let nextHidden = primaryHiddenRef.current;

      if (y <= TOP_REVEAL_Y) {
        nextHidden = false;
      } else if (delta > DIRECTION_DELTA) {
        nextHidden = true;
      } else if (delta < -DIRECTION_DELTA) {
        nextHidden = false;
      }

      if (primaryHiddenRef.current !== nextHidden) {
        primaryHiddenRef.current = nextHidden;
        setPrimaryHidden(nextHidden);
      }
      lastScrollYRef.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-white">
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          primaryHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
        aria-hidden={primaryHidden}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`origin-top transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
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
                      href={`/${locale}`}
                      prefetchPolicy="intent"
                      className="relative block h-9 w-[92px] shrink-0"
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
                      <MobileNavDrawer
                        locale={locale}
                        currency={currency}
                        dictionary={dictionary}
                        user={user}
                        navItems={navItems}
                      />
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
            <div className="relative z-10 inline-flex shrink-0 items-center gap-5 overflow-visible">
              <AccountControls
                locale={locale}
                loginLabel={dictionary.header.login}
                logoutLabel={dictionary.header.logout}
                profileLabel={dictionary.header.profile}
                adminLabel={dictionary.header.admin}
                user={user}
              />
              <WishlistHeaderLink
                locale={locale}
                label={dictionary.nav.wishlist}
                count={wishlistCount}
              />
            </div>
            <HeaderCartTrigger
              locale={locale}
              currency={currency}
              dictionary={dictionary}
              itemCount={cartItemCount}
            />
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
