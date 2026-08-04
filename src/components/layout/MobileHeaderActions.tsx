"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";

import { HeaderUserIcon } from "@/components/layout/HeaderIcons";
import {
  MobileNavPanel,
  type MobileNavPanelProps,
} from "@/components/layout/MobileNavPanel";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { SessionUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileHeaderActionsProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
};

/** Match bottom-nav idle tabs: 48px on small phones, 56px from 390px. */
const actionButtonClassName =
  "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-red text-white transition hover:bg-brand-red-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red min-[390px]:size-14";

const MENU_ICON_MS = 280;

/**
 * Figma mobile header `164:379` — red circular menu + profile.
 * Burger morphs to X like MaMarie when the dropdown menu is open.
 * Burger stays through tablet (`lg`); profile circle is phone-only — on iPad Mini
 * profile lives in the bottom navbar instead.
 */
export function MobileHeaderActions({
  locale,
  currency,
  dictionary,
  user,
  navItems,
  categories,
}: MobileHeaderActionsProps) {
  const [open, setOpen] = useState(false);
  const menuId = `mobile-nav-${useId().replace(/:/g, "")}`;
  const profileHref = user ? `/${locale}/profile` : `/${locale}/login`;
  const profileLabel = user
    ? dictionary.header.profile
    : dictionary.header.login;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const panelProps: Omit<MobileNavPanelProps, "categorySlug"> = {
    locale,
    currency,
    dictionary,
    navItems,
    categories,
    isOpen: open,
    menuId,
    onClose: () => setOpen(false),
  };

  return (
    <div className="flex items-center gap-[11px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${actionButtonClassName} lg:hidden`}
        aria-label={
          open ? dictionary.nav.closeMenu : dictionary.nav.openMenu
        }
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span
          className="absolute flex size-5 flex-col justify-center gap-1 transition-[opacity,transform] ease-out min-[390px]:size-6 min-[390px]:gap-[5px]"
          style={{
            opacity: open ? 0 : 1,
            transform: open
              ? "rotate(-90deg) scale(0.82)"
              : "rotate(0deg) scale(1)",
            transitionDuration: `${MENU_ICON_MS}ms`,
          }}
          aria-hidden
        >
          <span className="h-0.5 w-full rounded bg-white" />
          <span className="h-0.5 w-full rounded bg-white" />
          <span className="h-0.5 w-full rounded bg-white" />
        </span>
        <X
          className="absolute size-5 text-white transition-[opacity,transform] ease-out min-[390px]:size-6"
          style={{
            opacity: open ? 1 : 0,
            transform: open
              ? "rotate(0deg) scale(1)"
              : "rotate(90deg) scale(0.82)",
            transitionDuration: `${MENU_ICON_MS}ms`,
          }}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <AppLink
        href={profileHref}
        prefetchPolicy="intent"
        className={`${actionButtonClassName} md:hidden`}
        aria-label={profileLabel}
        onClick={() => setOpen(false)}
      >
        <HeaderUserIcon className="block size-5 overflow-visible text-white min-[390px]:size-6" />
      </AppLink>

      <Suspense
        fallback={
          <MobileNavPanel {...panelProps} categorySlug={null} />
        }
      >
        <MobileNavPanelWithSearchParams {...panelProps} />
      </Suspense>
    </div>
  );
}

function MobileNavPanelWithSearchParams(
  props: Omit<MobileNavPanelProps, "categorySlug">,
) {
  const searchParams = useSearchParams();
  return (
    <MobileNavPanel {...props} categorySlug={searchParams.get("category")} />
  );
}
