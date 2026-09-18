import { cache, Suspense, type ReactNode } from "react";

import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartTrigger } from "@/components/layout/HeaderCartTrigger";
import { HeaderCoinsPill } from "@/components/layout/HeaderCoinsPill";
import { MobileHeaderActions } from "@/components/layout/MobileHeaderActions";
import {
  MobileNavAuthButton,
  MobileNavAuthButtonFallback,
} from "@/components/layout/MobileNavAuthButton";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import { guestCoinsLoginHref } from "@/features/auth/guest-coins-login";
import { getCartItemCount } from "@/features/cart/cart";
import { getUserBonusBalance } from "@/features/loyalty/application/queries";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import { getWishlistCount } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type HeaderSessionData = {
  user: SessionUser | null;
  cartItemCount: number;
  wishlistCount: number;
  bonusBalanceAmount: number;
};

const loadHeaderSessionData = cache(async (): Promise<HeaderSessionData> => {
  const [user, cartItemCount, wishlistCount] = await Promise.all([
    getCurrentUser(),
    getCartItemCount(),
    getWishlistCount(),
  ]);
  const bonusBalanceAmount = user
    ? await getUserBonusBalance(user.id)
    : 0;

  return { user, cartItemCount, wishlistCount, bonusBalanceAmount };
});

type HeaderDesktopActionsProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

function CoinsPillFromSession({
  locale,
  dictionary,
  user,
  bonusBalanceAmount,
  size,
}: {
  locale: Locale;
  dictionary: Dictionary;
  user: SessionUser | null;
  bonusBalanceAmount: number;
  size?: "md" | "sm";
}): ReactNode {
  return (
    <HeaderCoinsPill
      locale={locale}
      balanceAmount={user ? bonusBalanceAmount : 0}
      coinsLabel={dictionary.header.coins}
      ariaLabel={dictionary.header.coinsAria}
      href={
        user ? `/${locale}/profile/bonuses` : guestCoinsLoginHref(locale)
      }
      size={size}
    />
  );
}

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
  availableCurrencies: readonly Currency[];
  dictionary: Dictionary;
  navItems: readonly StorefrontNavItem[];
};

type HeaderCoinsIslandProps = {
  locale: Locale;
  dictionary: Dictionary;
};

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

async function MobileNavAuthActionAsync({
  locale,
  loginLabel,
  profileLabel,
}: {
  locale: Locale;
  loginLabel: string;
  profileLabel: string;
}) {
  const { user } = await loadHeaderSessionData();

  return (
    <MobileNavAuthButton
      href={user ? `/${locale}/profile` : `/${locale}/login`}
      label={user ? profileLabel : loginLabel}
    />
  );
}

async function HeaderCoinsAsync({
  locale,
  dictionary,
}: HeaderCoinsIslandProps) {
  const { user, bonusBalanceAmount } = await loadHeaderSessionData();

  return (
    <CoinsPillFromSession
      locale={locale}
      dictionary={dictionary}
      user={user}
      bonusBalanceAmount={bonusBalanceAmount}
      size="md"
    />
  );
}

/** Bonuses pill beside search — always mounted (incl. ISR catalog routes). */
export function HeaderCoinsIsland(props: HeaderCoinsIslandProps) {
  return (
    <Suspense
      fallback={
        <div className="h-12 w-[6.5rem] animate-pulse rounded-full bg-brand-surface sm:h-[49px]" />
      }
    >
      <HeaderCoinsAsync {...props} />
    </Suspense>
  );
}

export function HeaderMobileNavIsland(props: HeaderMobileNavProps) {
  return (
    <MobileHeaderActions
      locale={props.locale}
      currency={props.currency}
      availableCurrencies={props.availableCurrencies}
      dictionary={props.dictionary}
      navItems={props.navItems}
      authAction={
        <Suspense fallback={<MobileNavAuthButtonFallback />}>
          <MobileNavAuthActionAsync
            locale={props.locale}
            loginLabel={props.dictionary.header.login}
            profileLabel={props.dictionary.header.profile}
          />
        </Suspense>
      }
    />
  );
}
