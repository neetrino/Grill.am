"use client";

import { Heart, Home, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";

import { AppLink } from "@/components/ui/AppLink";
import { HeaderUserIcon } from "@/components/layout/HeaderIcons";
import { ShopNavIcon } from "@/components/layout/ShopNavIcon";
import styles from "@/components/layout/MobileBottomNav.module.css";
import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

const BOTTOM_NAV_TRANSITION_MS = 380;

type MobileBottomNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  cartItemCount: number;
  wishlistCount: number;
};

type NavIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
}>;

type NavTabId = "home" | "shop" | "cart" | "wishlist" | "profile";

type NavTab = {
  id: Exclude<NavTabId, "cart">;
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
  /** Overrides default inactive / active icon sizes. */
  iconClassName?: { active: string; idle: string };
  /** Extra classes on the tab control (e.g. tablet-only visibility). */
  className?: string;
};

function ProfileNavIcon({ className }: { className?: string }) {
  return <HeaderUserIcon className={className} />;
}

type IndicatorBox = {
  left: number;
  top: number;
  width: number;
  height: number;
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
    ? `relative z-10 flex h-12 w-[100px] shrink-0 items-center gap-1 overflow-hidden rounded-[70px] bg-transparent px-1.5 text-[12px] font-medium text-white min-[390px]:h-14 min-[390px]:w-[118px] min-[390px]:px-2 min-[390px]:text-[13px] ${styles.tab}`
    : `relative z-10 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#171717] min-[390px]:size-14 ${styles.tab}`;
}

/**
 * Figma mobile bottom bar `164:604` — floating dark island.
 * Active tab expands to the red pill + label; the pill slides between options.
 */
export function MobileBottomNav({
  locale,
  currency,
  dictionary,
  user,
  cartItemCount,
  wishlistCount,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<NavTabId, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null);
  const [slideEnabled, setSlideEnabled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const homeActive = isHomePath(pathname, locale);
  const shopActive = startsWithPath(pathname, `/${locale}/products`);
  const wishlistActive = startsWithPath(pathname, `/${locale}/wishlist`);
  const profileActive =
    startsWithPath(pathname, `/${locale}/profile`) ||
    startsWithPath(pathname, `/${locale}/login`) ||
    startsWithPath(pathname, `/${locale}/register`);

  const activeId: NavTabId | null = cartOpen
    ? "cart"
    : homeActive
      ? "home"
      : shopActive
        ? "shop"
        : wishlistActive
          ? "wishlist"
          : profileActive
            ? "profile"
            : null;

  const homeTab: NavTab = {
    id: "home",
    href: `/${locale}`,
    label: dictionary.nav.home,
    icon: Home,
  };

  const shopTab: NavTab = {
    id: "shop",
    href: `/${locale}/products`,
    label: dictionary.nav.products,
    icon: ShopNavIcon,
    iconClassName: {
      idle: "size-6 min-[390px]:size-8",
      active: "size-7 min-[390px]:size-9",
    },
  };

  const wishlistTab: NavTab = {
    id: "wishlist",
    href: `/${locale}/wishlist`,
    label: dictionary.nav.wishlist,
    icon: Heart,
    badge: wishlistCount,
  };

  const profileTab: NavTab = {
    id: "profile",
    href: user ? `/${locale}/profile` : `/${locale}/login`,
    label: user ? dictionary.header.profile : dictionary.header.login,
    icon: ProfileNavIcon,
    iconClassName: {
      idle: "size-5 min-[390px]:size-6",
      active: "size-6 min-[390px]:size-7",
    },
    /** Tablet / iPad Mini: header profile circle is hidden from md. */
    className: "max-md:hidden",
  };

  useLayoutEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (!activeId) {
        setIndicator(null);
        return;
      }
      const el = itemRefs.current.get(activeId);
      // Hidden tablet-only tabs (e.g. profile below md) must not drive the pill.
      if (!el || el.offsetWidth === 0) {
        setIndicator(null);
        return;
      }
      setIndicator({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeId]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setSlideEnabled(true);
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") {
      return;
    }

    const syncIndicator = (): void => {
      if (!activeId) {
        setIndicator(null);
        return;
      }
      const el = itemRefs.current.get(activeId);
      if (!el || el.offsetWidth === 0) {
        setIndicator(null);
        return;
      }
      setIndicator({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    const observer = new ResizeObserver(syncIndicator);
    observer.observe(track);
    for (const el of itemRefs.current.values()) {
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
    };
  }, [activeId]);

  function registerItem(id: NavTabId, node: HTMLElement | null): void {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }

  return (
    <nav
      aria-label={dictionary.nav.navigation}
      data-mobile-bottom-nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] min-[390px]:px-8 lg:hidden"
      style={
        {
          "--bottom-nav-ms": `${BOTTOM_NAV_TRANSITION_MS}ms`,
        } as CSSProperties
      }
    >
      <div
        ref={trackRef}
        className="pointer-events-auto relative flex h-[60px] w-full max-w-[327px] items-center justify-evenly overflow-hidden rounded-[100px] bg-[#171717] px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] min-[390px]:h-[71px] min-[390px]:px-3 min-[390px]:py-2 md:max-w-[420px]"
      >
        {indicator && activeId ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute z-0 rounded-[70px] bg-brand-red ${
              slideEnabled ? styles.indicator : styles.indicatorInstant
            }`}
            style={{
              left: indicator.left,
              top: indicator.top,
              width: indicator.width,
              height: indicator.height,
            }}
          />
        ) : null}

        <PillTab
          tab={homeTab}
          active={activeId === "home"}
          register={(node) => registerItem("home", node)}
        />
        <PillTab
          tab={shopTab}
          active={activeId === "shop"}
          register={(node) => registerItem("shop", node)}
        />

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
            <CartPillButton
              open={open}
              active={activeId === "cart"}
              badgeCount={badgeCount}
              label={label}
              openDrawer={openDrawer}
              prefetchDrawerView={prefetchDrawerView}
              onOpenChange={setCartOpen}
              register={(node) => registerItem("cart", node)}
            />
          )}
        />

        <PillTab
          tab={wishlistTab}
          active={activeId === "wishlist"}
          register={(node) => registerItem("wishlist", node)}
        />
        <PillTab
          tab={profileTab}
          active={activeId === "profile"}
          register={(node) => registerItem("profile", node)}
        />
      </div>
    </nav>
  );
}

function CartPillButton({
  open,
  active,
  badgeCount,
  label,
  openDrawer,
  prefetchDrawerView,
  onOpenChange,
  register,
}: {
  open: boolean;
  active: boolean;
  badgeCount: number;
  label: string;
  openDrawer: () => void;
  prefetchDrawerView: () => void;
  onOpenChange: (open: boolean) => void;
  register: (node: HTMLButtonElement | null) => void;
}) {
  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  return (
    <button
      ref={register}
      type="button"
      onClick={openDrawer}
      onPointerEnter={prefetchDrawerView}
      onFocus={prefetchDrawerView}
      aria-label={label}
      aria-expanded={open}
      className={tabClassName(active)}
    >
      <span className="relative inline-flex shrink-0" data-cart-fly-target>
        <ShoppingCart
          className={`${styles.tabIcon} ${active ? "size-6 min-[390px]:size-[31px]" : "size-5 min-[390px]:size-6"}`}
          strokeWidth={1.75}
          aria-hidden
        />
        <NavBadge count={badgeCount} />
      </span>
      <span
        className={`truncate pr-1 ${styles.tabLabel} ${
          active ? "" : styles.tabLabelHidden
        }`}
        aria-hidden={!active}
      >
        {label}
      </span>
    </button>
  );
}

function PillTab({
  tab,
  active,
  register,
}: {
  tab: NavTab;
  active: boolean;
  register: (node: HTMLAnchorElement | null) => void;
}) {
  const Icon = tab.icon;
  const iconClassName = active
    ? (tab.iconClassName?.active ?? "size-6 min-[390px]:size-[31px]")
    : (tab.iconClassName?.idle ?? "size-5 min-[390px]:size-6");

  return (
    <AppLink
      ref={register}
      href={tab.href}
      prefetchPolicy="intent"
      aria-current={active ? "page" : undefined}
      aria-label={tab.label}
      className={`${tabClassName(active)}${tab.className ? ` ${tab.className}` : ""}`}
    >
      <span className="relative inline-flex shrink-0">
        <Icon
          className={`${styles.tabIcon} ${iconClassName}`}
          strokeWidth={tab.id === "shop" ? 1.35 : 1.75}
          aria-hidden
        />
        {tab.badge != null ? <NavBadge count={tab.badge} /> : null}
      </span>
      <span
        className={`truncate pr-1 ${styles.tabLabel} ${
          active ? "" : styles.tabLabelHidden
        }`}
        aria-hidden={!active}
      >
        {tab.label}
      </span>
    </AppLink>
  );
}
