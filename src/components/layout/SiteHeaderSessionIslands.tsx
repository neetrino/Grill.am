import { cache, Suspense } from "react";

import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartTrigger } from "@/components/layout/HeaderCartTrigger";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { getCartItemCount } from "@/features/cart/cart";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import { getWishlistCount } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
};

type HeaderSessionData = {
  user: SessionUser | null;
  cartItemCount: number;
  wishlistCount: number;
};

const loadHeaderSessionData = cache(async (): Promise<HeaderSessionData> => {
  const [user, cartItemCount, wishlistCount] = await Promise.all([
    getCurrentUser(),
    getCartItemCount(),
    getWishlistCount(),
  ]);

  return { user, cartItemCount, wishlistCount };
});

type HeaderDesktopActionsProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

async function HeaderDesktopActionsAsync({
  locale,
  currency,
  dictionary,
}: HeaderDesktopActionsProps) {
  const { user, cartItemCount, wishlistCount } = await loadHeaderSessionData();

  return (
    <>
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
    </>
  );
}

function HeaderDesktopActionsFallback() {
  return (
    <>
      <div className="relative z-10 inline-flex shrink-0 items-center gap-5 overflow-visible">
        <div className="h-[25px] w-[23px] animate-pulse rounded bg-brand-surface" />
        <div className="h-[25px] w-[30px] animate-pulse rounded bg-brand-surface" />
      </div>
      <div className="h-[49px] w-[114px] animate-pulse rounded-full bg-brand-surface" />
    </>
  );
}

type HeaderMobileNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  navItems: readonly NavItem[];
};

async function HeaderMobileNavAsync({
  locale,
  currency,
  dictionary,
  navItems,
}: HeaderMobileNavProps) {
  const { user } = await loadHeaderSessionData();

  return (
    <MobileNavDrawer
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      user={user}
      navItems={navItems}
    />
  );
}

/**
 * Session-dependent header controls stream in without remounting sticky chrome.
 */
export function HeaderDesktopActionsIsland(props: HeaderDesktopActionsProps) {
  return (
    <Suspense fallback={<HeaderDesktopActionsFallback />}>
      <HeaderDesktopActionsAsync {...props} />
    </Suspense>
  );
}

export function HeaderMobileNavIsland(props: HeaderMobileNavProps) {
  return (
    <Suspense
      fallback={
        <MobileNavDrawer
          locale={props.locale}
          currency={props.currency}
          dictionary={props.dictionary}
          user={null}
          navItems={props.navItems}
        />
      }
    >
      <HeaderMobileNavAsync {...props} />
    </Suspense>
  );
}
