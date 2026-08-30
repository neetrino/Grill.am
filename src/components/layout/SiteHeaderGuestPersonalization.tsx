import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartTrigger } from "@/components/layout/HeaderCartTrigger";
import { MobileHeaderActions } from "@/components/layout/MobileHeaderActions";
import { MobileNavAuthButton } from "@/components/layout/MobileNavAuthButton";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type GuestHeaderProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

type GuestMobileNavProps = GuestHeaderProps & {
  availableCurrencies: readonly Currency[];
  navItems: readonly StorefrontNavItem[];
};

/** Cookie-free mobile menu so catalog routes can stay ISR. */
export function HeaderGuestMobileNav({
  locale,
  currency,
  availableCurrencies,
  dictionary,
  navItems,
}: GuestMobileNavProps) {
  return (
    <MobileHeaderActions
      locale={locale}
      currency={currency}
      availableCurrencies={availableCurrencies}
      dictionary={dictionary}
      navItems={navItems}
      authAction={
        <MobileNavAuthButton
          href={`/${locale}/login`}
          label={dictionary.header.login}
        />
      }
    />
  );
}

/** Cookie-free desktop account/cart chrome; badges hydrate from local sync. */
export function HeaderGuestDesktopActions({
  locale,
  currency,
  dictionary,
}: GuestHeaderProps) {
  return (
    <>
      <div className="relative z-10 inline-flex shrink-0 items-center gap-5 overflow-visible">
        <AccountControls
          locale={locale}
          loginLabel={dictionary.header.login}
          logoutLabel={dictionary.header.logout}
          profileLabel={dictionary.header.profile}
          adminLabel={dictionary.header.admin}
          user={null}
        />
        <WishlistHeaderLink
          locale={locale}
          label={dictionary.nav.wishlist}
          count={0}
        />
      </div>
      <HeaderCartTrigger
        locale={locale}
        currency={currency}
        dictionary={dictionary}
        itemCount={0}
      />
    </>
  );
}
