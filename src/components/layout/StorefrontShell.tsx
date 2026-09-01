import { MaintenanceGate } from "@/components/layout/MaintenanceGate";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileBottomNavIsland } from "@/components/layout/MobileBottomNavIsland";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StorefrontScrollToTop } from "@/components/layout/StorefrontScrollToTop";
import { StorefrontSurface } from "@/components/layout/StorefrontSurface";
import { CartMinOrderAlertHost } from "@/features/cart/ui/CartMinOrderAlertHost";
import { getActiveStorefrontPopup } from "@/features/popups/application/queries";
import { SitePopupOverlayLazy } from "@/features/popups/ui/SitePopupOverlayLazy";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type StorefrontShellProps = {
  locale: Locale;
  dictionary: Dictionary;
  currency: Currency;
  availableCurrencies: readonly Currency[];
  /** Session/cart/maintenance cookies. Off for ISR catalog routes. */
  personalize: boolean;
  children: React.ReactNode;
};

/**
 * Shared storefront chrome. `personalize={false}` keeps the tree free of
 * cookies/headers so `/[locale]/products` can be ISR/CDN cached.
 */
export async function StorefrontShell({
  locale,
  dictionary,
  currency,
  availableCurrencies,
  personalize,
  children,
}: StorefrontShellProps) {
  const activePopup = await getActiveStorefrontPopup();

  return (
    <StorefrontSurface>
      <StorefrontScrollToTop />
      <SiteHeader
        locale={locale}
        currency={currency}
        availableCurrencies={availableCurrencies}
        dictionary={dictionary}
        personalize={personalize}
      />
      <main className="page-container flex-1 py-10 pb-28 lg:pb-10">
        {personalize ? (
          <MaintenanceGate>{children}</MaintenanceGate>
        ) : (
          children
        )}
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
      {personalize ? (
        <MobileBottomNavIsland
          locale={locale}
          currency={currency}
          dictionary={dictionary}
        />
      ) : (
        <MobileBottomNav
          locale={locale}
          currency={currency}
          dictionary={dictionary}
          user={null}
          cartItemCount={0}
          wishlistCount={0}
        />
      )}
      {activePopup ? (
        <SitePopupOverlayLazy
          imageUrl={activePopup.imageUrl}
          closeLabel={dictionary.popup.close}
        />
      ) : null}
      <CartMinOrderAlertHost
        messageTemplate={dictionary.cartDrawer.minOrderQuantity}
        closeLabel={dictionary.cartDrawer.close}
      />
    </StorefrontSurface>
  );
}
