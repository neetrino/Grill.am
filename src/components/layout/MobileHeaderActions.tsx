"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import {
  MobileNavPanel,
  type MobileNavPanelProps,
} from "@/components/layout/MobileNavPanel";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileHeaderActionsProps = {
  locale: Locale;
  currency: Currency;
  availableCurrencies: readonly Currency[];
  dictionary: Dictionary;
  navItems: readonly StorefrontNavItem[];
  authAction: ReactNode;
};

/** Slightly tighter than bottom-nav idle tabs: 44px on small phones, 48px from 390px. */
const actionButtonClassName =
  "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-red text-white transition hover:bg-brand-red-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red min-[390px]:size-12";

const MENU_ICON_MS = 280;

/**
 * Figma mobile header `164:379` — red circular menu.
 * Burger morphs to X like MaMarie when the dropdown menu is open.
 * Profile lives in the bottom navbar (right), not in the header.
 */
export function MobileHeaderActions({
  locale,
  currency,
  availableCurrencies,
  dictionary,
  navItems,
  authAction,
}: MobileHeaderActionsProps) {
  const [open, setOpen] = useState(false);
  const menuId = `mobile-nav-${useId().replace(/:/g, "")}`;

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

  const panelProps: MobileNavPanelProps = {
    locale,
    currency,
    availableCurrencies,
    dictionary,
    navItems,
    authAction,
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
          className="absolute flex size-4.5 flex-col justify-center gap-1 transition-[opacity,transform] ease-out min-[390px]:size-5 min-[390px]:gap-[5px]"
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
          className="absolute size-4.5 text-white transition-[opacity,transform] ease-out min-[390px]:size-5"
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

      <MobileNavPanel {...panelProps} />
    </div>
  );
}
