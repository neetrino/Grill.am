"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  TicketPercent,
  Trash2,
  User,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import {
  PROFILE_NAV_ACTIVE,
  PROFILE_NAV_TRANSITION_MS,
  PROFILE_SIDEBAR_ICON_TONE,
  type ProfileNavKey,
} from "@/features/profile/ui/profile-ui";
import styles from "@/features/profile/ui/ProfileSidebarNav.module.css";

type ProfileSidebarNavProps = {
  locale: Locale;
  dictionary: Dictionary["profile"];
  logoutAction: (formData: FormData) => void | Promise<void>;
};

type NavItem = {
  key: ProfileNavKey;
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

type IndicatorBox = {
  top: number;
  height: number;
};

function buildNavItems(
  locale: Locale,
  dictionary: Dictionary["profile"],
): NavItem[] {
  return [
    {
      key: "dashboard",
      href: `/${locale}/profile`,
      label: dictionary.dashboard,
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true,
    },
    {
      key: "orders",
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package className="h-5 w-5" />,
    },
    {
      key: "promoCodes",
      href: `/${locale}/profile/promo-codes`,
      label: dictionary.promoCodes.nav,
      icon: <TicketPercent className="h-5 w-5" />,
    },
    {
      key: "personal",
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User className="h-5 w-5" />,
    },
    {
      key: "addresses",
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      key: "password",
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock className="h-5 w-5" />,
    },
    {
      key: "deleteAccount",
      href: `/${locale}/profile/delete-account`,
      label: dictionary.deleteAccount,
      icon: <Trash2 className="h-5 w-5" />,
    },
  ];
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function ProfileSidebarNav({
  locale,
  dictionary,
  logoutAction,
}: ProfileSidebarNavProps) {
  const pathname = usePathname();
  const items = buildNavItems(locale, dictionary);
  const activeItem =
    items.find((item) => isItemActive(pathname, item)) ?? items[0] ?? null;

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null);
  const [slideEnabled, setSlideEnabled] = useState(false);

  const activeHref = activeItem?.href ?? "";

  useLayoutEffect(() => {
    const link = linkRefs.current.get(activeHref);
    if (!link) {
      return;
    }
    setIndicator({
      top: link.offsetTop,
      height: link.offsetHeight,
    });
  }, [activeHref, items.length]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setSlideEnabled(true);
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      const link = linkRefs.current.get(activeHref);
      if (!link) {
        return;
      }
      setIndicator({
        top: link.offsetTop,
        height: link.offsetHeight,
      });
    });
    observer.observe(nav);
    for (const link of linkRefs.current.values()) {
      observer.observe(link);
    }
    return () => {
      observer.disconnect();
    };
  }, [activeHref, items.length]);

  return (
    <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-gray-100 pt-4">
      <nav
        ref={navRef}
        className="relative flex flex-col gap-1"
        aria-label={dictionary.title}
        style={
          {
            "--profile-nav-ms": `${PROFILE_NAV_TRANSITION_MS}ms`,
          } as CSSProperties
        }
      >
        {indicator ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute right-0 left-0 z-0 rounded-[15px] border-l-4 ${
              slideEnabled ? styles.indicator : styles.indicatorInstant
            }`}
            style={{
              top: indicator.top,
              height: indicator.height,
              backgroundColor: PROFILE_NAV_ACTIVE.background,
              borderLeftColor: PROFILE_NAV_ACTIVE.border,
            }}
          />
        ) : null}

        {items.map((item) => {
          const active = isItemActive(pathname, item);

          return (
            <AppLink
              key={item.href}
              href={item.href}
              prefetchPolicy="intent"
              ref={(node) => {
                if (node) {
                  linkRefs.current.set(item.href, node);
                } else {
                  linkRefs.current.delete(item.href);
                }
              }}
              className={`relative z-10 flex w-full items-center gap-3 rounded-[15px] border-l-4 border-transparent px-3 py-2.5 text-left ${
                active ? "" : "hover:bg-white/70"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: PROFILE_SIDEBAR_ICON_TONE.background,
                  color: PROFILE_SIDEBAR_ICON_TONE.foreground,
                }}
              >
                {item.icon}
              </span>
              <span
                className={`${styles.tabLabel} min-w-0 flex-1 text-sm ${
                  active
                    ? "font-semibold text-brand-red"
                    : "font-medium text-gray-800"
                }`}
              >
                {item.label}
              </span>
            </AppLink>
          );
        })}
      </nav>

      <form action={logoutAction} className="mt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[15px] border-l-4 border-transparent px-3 py-2.5 text-left transition-colors hover:bg-white/70"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: PROFILE_SIDEBAR_ICON_TONE.background,
              color: PROFILE_SIDEBAR_ICON_TONE.foreground,
            }}
          >
            <LogOut className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-brand-red">
            {dictionary.logout}
          </span>
        </button>
      </form>
    </div>
  );
}
