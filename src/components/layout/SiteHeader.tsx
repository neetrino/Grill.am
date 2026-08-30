import {
  HeaderGuestDesktopActions,
  HeaderGuestMobileNav,
} from "@/components/layout/SiteHeaderGuestPersonalization";
import {
  HeaderDesktopActionsIsland,
  HeaderMobileNavIsland,
} from "@/components/layout/SiteHeaderSessionIslands";
import { SiteHeaderMainNav } from "@/components/layout/SiteHeaderMainNav";
import { getStorefrontNavItems } from "@/components/layout/storefront-nav";
import { listStorefrontNavCategories } from "@/features/categories/application/list-storefront-nav-categories";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type SiteHeaderProps = {
  locale: Locale;
  currency: Currency;
  availableCurrencies: readonly Currency[];
  dictionary: Dictionary;
  /**
   * When false, skip session/cart/wishlist cookies so the route can be ISR.
   * Client cart/wishlist badges still hydrate from local sync.
   */
  personalize?: boolean;
};

/**
 * Sticky chrome stays mounted across navigations. Only account/cart/wishlist
 * stream through nested Suspense islands (no full-header remount flicker).
 */
export async function SiteHeader({
  locale,
  currency,
  availableCurrencies,
  dictionary,
  personalize = true,
}: SiteHeaderProps) {
  const navItems = getStorefrontNavItems(locale, dictionary);
  const categories = await listStorefrontNavCategories(locale);
  const guest = !personalize;

  return (
    <SiteHeaderMainNav
      locale={locale}
      currency={currency}
      availableCurrencies={availableCurrencies}
      dictionary={dictionary}
      navItems={navItems}
      categories={categories}
      mobileNav={
        guest ? (
          <HeaderGuestMobileNav
            locale={locale}
            currency={currency}
            availableCurrencies={availableCurrencies}
            dictionary={dictionary}
            navItems={navItems}
          />
        ) : (
          <HeaderMobileNavIsland
            locale={locale}
            currency={currency}
            availableCurrencies={availableCurrencies}
            dictionary={dictionary}
            navItems={navItems}
          />
        )
      }
      desktopActions={
        guest ? (
          <HeaderGuestDesktopActions
            locale={locale}
            currency={currency}
            dictionary={dictionary}
          />
        ) : (
          <HeaderDesktopActionsIsland
            locale={locale}
            currency={currency}
            dictionary={dictionary}
          />
        )
      }
    />
  );
}
