import { Suspense } from "react";

import { SiteHeaderMainNav } from "@/components/layout/SiteHeaderMainNav";
import { getCartItemCount } from "@/features/cart/cart";
import { getWishlistCount } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type SiteHeaderProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

function HeaderControlsFallback() {
  return (
    <div
      className="h-11 w-28 animate-pulse rounded-lg bg-brand-surface"
      aria-hidden="true"
    />
  );
}

async function SiteHeaderMainNavAsync({
  locale,
  currency,
  dictionary,
}: SiteHeaderProps) {
  const navItems = [
    { href: `/${locale}`, label: dictionary.nav.home },
    { href: `/${locale}/products`, label: dictionary.nav.products },
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/about`, label: dictionary.nav.about },
    { href: `/${locale}/careers`, label: dictionary.nav.careers },
    { href: `/${locale}/contact`, label: dictionary.nav.contact },
  ] as const;

  const [user, cartItemCount, wishlistCount] = await Promise.all([
    getCurrentUser(),
    getCartItemCount(),
    getWishlistCount(),
  ]);

  return (
    <SiteHeaderMainNav
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      user={user}
      navItems={navItems}
      cartItemCount={cartItemCount}
      wishlistCount={wishlistCount}
    />
  );
}

/**
 * Storefront chrome: account/cart/wishlist load in a Suspense island
 * so page content is not blocked.
 */
export function SiteHeader({ locale, currency, dictionary }: SiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="relative z-40 bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
            <span className="text-lg font-semibold tracking-tight text-[#101010]">
              {dictionary.brand}
            </span>
            <HeaderControlsFallback />
          </div>
        </header>
      }
    >
      <SiteHeaderMainNavAsync
        locale={locale}
        currency={currency}
        dictionary={dictionary}
      />
    </Suspense>
  );
}
