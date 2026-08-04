import { Suspense } from "react";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getCartItemCount } from "@/features/cart/cart";
import { getWishlistCount } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileBottomNavIslandProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

function MobileBottomNavFallback() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-8 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
      aria-hidden="true"
    >
      <div className="h-[71px] w-full max-w-[327px] rounded-[100px] bg-[#171717]/80 md:max-w-[420px]" />
    </div>
  );
}

async function MobileBottomNavAsync({
  locale,
  currency,
  dictionary,
}: MobileBottomNavIslandProps) {
  const [user, cartItemCount, wishlistCount] = await Promise.all([
    getCurrentUser(),
    getCartItemCount(),
    getWishlistCount(),
  ]);

  return (
    <MobileBottomNav
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      user={user}
      cartItemCount={cartItemCount}
      wishlistCount={wishlistCount}
    />
  );
}

/**
 * Mobile-only tab bar; counts stream in via Suspense so layout chrome is not blocked.
 */
export function MobileBottomNavIsland({
  locale,
  currency,
  dictionary,
}: MobileBottomNavIslandProps) {
  return (
    <Suspense fallback={<MobileBottomNavFallback />}>
      <MobileBottomNavAsync
        locale={locale}
        currency={currency}
        dictionary={dictionary}
      />
    </Suspense>
  );
}
