import { listStorefrontNavCategories } from "@/features/categories/application/list-storefront-nav-categories";
import {
  HeaderDesktopActionsIsland,
  HeaderMobileNavIsland,
} from "@/components/layout/SiteHeaderSessionIslands";
import { SiteHeaderMainNav } from "@/components/layout/SiteHeaderMainNav";
import { getStorefrontNavItems } from "@/components/layout/storefront-nav";
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
export async function SiteHeader({
  locale,
  currency,
  dictionary,
}: SiteHeaderProps) {
  const navItems = getStorefrontNavItems(locale, dictionary);
  const categories = await listStorefrontNavCategories(locale);

  return (
    <SiteHeaderMainNav
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      navItems={navItems}
      categories={categories}
      mobileNav={
        <HeaderMobileNavIsland
          locale={locale}
          currency={currency}
          dictionary={dictionary}
          navItems={navItems}
          categories={categories}
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
