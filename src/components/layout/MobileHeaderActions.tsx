"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

const actionButtonClassName =
  "flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition hover:bg-brand-red-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red";

/**
 * Figma mobile header `164:379` — red circular menu + profile actions.
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
  const profileHref = user
    ? `/${locale}/profile`
    : `/${locale}/login`;
  const profileLabel = user
    ? dictionary.header.profile
    : dictionary.header.login;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const panelProps: Omit<MobileNavPanelProps, "categorySlug"> = {
    locale,
    currency,
    dictionary,
    user,
    navItems,
    categories,
    onClose: () => setOpen(false),
  };

  return (
    <div className="flex items-center gap-[11px] md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={actionButtonClassName}
        aria-label={dictionary.nav.openMenu}
        aria-expanded={open}
      >
        <span className="flex w-6 flex-col gap-[5px]" aria-hidden>
          <span className="h-0.5 w-full rounded bg-white" />
          <span className="h-0.5 w-full rounded bg-white" />
          <span className="h-0.5 w-full rounded bg-white" />
        </span>
      </button>

      <AppLink
        href={profileHref}
        prefetchPolicy="intent"
        className={actionButtonClassName}
        aria-label={profileLabel}
      >
        <HeaderUserIcon className="block h-[30px] w-[30px] overflow-visible text-white" />
      </AppLink>

      {open ? (
        <Suspense
          fallback={<MobileNavPanel {...panelProps} categorySlug={null} />}
        >
          <MobileNavPanelWithSearchParams {...panelProps} />
        </Suspense>
      ) : null}
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
