"use client";

import { Heart, Home, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { ShopNavIcon } from "@/components/layout/ShopNavIcon";
import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileBottomNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  cartItemCount: number;
  wishlistCount: number;
};

type NavIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
}>;

type NavTab = {
  id: string;
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
  /** Overrides default inactive `size-6` / active `size-[31px]`. */
  iconClassName?: { active: string; idle: string };
};

function isHomePath(pathname: string, locale: Locale): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

function startsWithPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold leading-none text-[#171717]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function tabClassName(active: boolean): string {
  return active
    ? "relative flex h-14 min-w-[118px] shrink-0 items-center gap-1 rounded-[70px] bg-brand-red px-2 text-[13px] font-medium text-white transition-[min-width,background-color] duration-200"
    : "relative flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[#171717] transition-[min-width,background-color] duration-200";
}

/**
 * Figma mobile bottom bar `164:604` — floating dark island.
 * Active tab expands to the red pill + label (same as Home).
 */
export function MobileBottomNav({
  locale,
  currency,
  dictionary,
  cartItemCount,
  wishlistCount,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? `/${locale}`;

  const homeActive = isHomePath(pathname, locale);
  const shopActive = startsWithPath(pathname, `/${locale}/products`);
  const wishlistActive = startsWithPath(pathname, `/${locale}/wishlist`);

  const homeTab: NavTab = {
    id: "home",
    href: `/${locale}`,
    label: dictionary.nav.home,
    icon: Home,
  };

  const shopTab: NavTab = {
    id: "shop",
    href: `/${locale}/products`,
    label: dictionary.nav.shop,
    icon: ShopNavIcon,
    iconClassName: { idle: "size-8", active: "size-9" },
  };

  const wishlistTab: NavTab = {
    id: "wishlist",
    href: `/${locale}/wishlist`,
    label: dictionary.nav.wishlist,
    icon: Heart,
    badge: wishlistCount,
  };

  return (
    <nav
      aria-label={dictionary.nav.navigation}
      data-mobile-bottom-nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-8 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto flex h-[71px] w-full max-w-[327px] items-center justify-evenly overflow-hidden rounded-[100px] bg-[#171717] px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <PillTab tab={homeTab} active={homeActive} />
        <PillTab tab={shopTab} active={shopActive} />

        <CartDrawer
          locale={locale}
          currency={currency}
          dictionary={dictionary}
          itemCount={cartItemCount}
          renderTrigger={({
            open,
            badgeCount,
            label,
            openDrawer,
            prefetchDrawerView,
          }) => (
            <button
              type="button"
              onClick={openDrawer}
              onPointerEnter={prefetchDrawerView}
              onFocus={prefetchDrawerView}
              aria-label={label}
              aria-expanded={open}
              className={tabClassName(open)}
            >
              <span className="relative inline-flex shrink-0" data-cart-fly-target>
                <ShoppingCart
                  className={open ? "size-[31px]" : "size-6"}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <NavBadge count={badgeCount} />
              </span>
              {open ? <span className="truncate pr-1">{label}</span> : null}
            </button>
          )}
        />

        <PillTab tab={wishlistTab} active={wishlistActive} />
      </div>
    </nav>
  );
}

function PillTab({ tab, active }: { tab: NavTab; active: boolean }) {
  const Icon = tab.icon;
  const iconClassName = active
    ? (tab.iconClassName?.active ?? "size-[31px]")
    : (tab.iconClassName?.idle ?? "size-6");

  return (
    <AppLink
      href={tab.href}
      prefetchPolicy="intent"
      aria-current={active ? "page" : undefined}
      aria-label={tab.label}
      className={tabClassName(active)}
    >
      <span className="relative inline-flex shrink-0">
        <Icon
          className={iconClassName}
          strokeWidth={tab.id === "shop" ? 1.35 : 1.75}
          aria-hidden
        />
        {tab.badge != null ? <NavBadge count={tab.badge} /> : null}
      </span>
      {active ? <span className="truncate pr-1">{tab.label}</span> : null}
    </AppLink>
  );
}
