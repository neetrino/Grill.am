"use client";

import { HeaderWishlistIcon } from "@/components/layout/HeaderIcons";
import { AppLink } from "@/components/ui/AppLink";
import { useWishlistCount } from "@/features/wishlist/wishlist-client-sync";
import type { Locale } from "@/lib/i18n/config";

type WishlistHeaderLinkProps = {
  locale: Locale;
  label: string;
  count: number;
};

export function WishlistHeaderLink({
  locale,
  label,
  count,
}: WishlistHeaderLinkProps) {
  const badgeCount = useWishlistCount(count);

  return (
    <AppLink
      href={`/${locale}/wishlist`}
      prefetchPolicy="intent"
      aria-label={label}
      className="relative z-10 inline-flex h-[25px] w-[30px] shrink-0 items-center justify-center overflow-visible text-[#131313] transition-colors duration-150 hover:text-brand-red"
    >
      <HeaderWishlistIcon className="block h-[25px] w-[30px] overflow-visible" />
      {badgeCount > 0 ? (
        <span className="absolute -top-2 -right-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </AppLink>
  );
}
