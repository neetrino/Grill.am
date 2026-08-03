import Image from "next/image";

import { AccountControls } from "@/components/layout/AccountControls";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { HeaderCartTrigger } from "@/components/layout/HeaderCartTrigger";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
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

  return (
    <header className="relative z-10 bg-white">
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
                className={`rounded-[10px] px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
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

        <div className="hidden items-center gap-4 py-4 md:flex">
          <div className="min-w-0 flex-1">
            <HeaderSearch
              locale={locale}
              currency={currency}
              labels={searchLabels}
              showLabel
              triggerClassName="flex h-14 w-full items-center gap-2 rounded-full bg-brand-surface px-8 text-sm text-[rgba(33,43,54,0.46)] transition hover:bg-[#ececec]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-4">
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
            <HeaderCartTrigger
              locale={locale}
              currency={currency}
              dictionary={dictionary}
              itemCount={cartItemCount}
            />
            <div className="flex h-12 items-center gap-2 rounded-full bg-brand-surface px-4 text-sm font-bold text-[#333]">
              <LocaleSwitcher
                locale={locale}
                label={dictionary.header.language}
              />
              <span aria-hidden>/</span>
              <CurrencySwitcher
                currency={currency}
                label={dictionary.header.currency}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
