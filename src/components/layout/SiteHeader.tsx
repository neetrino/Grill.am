import {
  HeaderDesktopActionsIsland,
  HeaderMobileNavIsland,
} from "@/components/layout/SiteHeaderSessionIslands";
import { SiteHeaderMainNav } from "@/components/layout/SiteHeaderMainNav";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type SiteHeaderProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

/**
 * Sticky chrome stays mounted across navigations. Only account/cart/wishlist
 * stream through nested Suspense islands (no full-header remount flicker).
 */
export function SiteHeader({ locale, currency, dictionary }: SiteHeaderProps) {
  const navItems = [
    { href: `/${locale}`, label: dictionary.nav.home },
    { href: `/${locale}/products`, label: dictionary.nav.products },
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/about`, label: dictionary.nav.about },
    { href: `/${locale}/careers`, label: dictionary.nav.careers },
    { href: `/${locale}/contact`, label: dictionary.nav.contact },
  ] as const;

  return (
    <SiteHeaderMainNav
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      navItems={navItems}
      mobileNav={
        <HeaderMobileNavIsland
          locale={locale}
          currency={currency}
          dictionary={dictionary}
          navItems={navItems}
        />
      }
      desktopActions={
        <HeaderDesktopActionsIsland
          locale={locale}
          currency={currency}
          dictionary={dictionary}
        />
      }
    />
  );
}
