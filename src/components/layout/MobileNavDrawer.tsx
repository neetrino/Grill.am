"use client";

import { Menu } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  MobileNavPanel,
  type MobileNavPanelProps,
} from "@/components/layout/MobileNavPanel";
import type { StorefrontNavItem } from "@/components/layout/storefront-nav";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type MobileNavDrawerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
};

export function MobileNavDrawer({
  locale,
  currency,
  dictionary,
  user,
  navItems,
  categories,
}: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:h-10 sm:w-10 md:hidden"
        aria-label={dictionary.nav.openMenu}
        aria-expanded={open}
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      </button>

      {open ? (
        <Suspense
          fallback={<MobileNavPanel {...panelProps} categorySlug={null} />}
        >
          <MobileNavPanelWithSearchParams {...panelProps} />
        </Suspense>
      ) : null}
    </>
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
