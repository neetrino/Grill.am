"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { profileBonusesPageHref } from "@/features/profile/ui/profile-sheet";
import { useDesktopChrome } from "@/features/profile/ui/use-desktop-chrome";
import type { Locale } from "@/lib/i18n/config";

type ProfileDesktopSheetRedirectProps = {
  locale: Locale;
  sheetOpen: boolean;
};

/**
 * `?sheet=bonuses` is a mobile sheet flag. Desktop always uses the
 * dedicated bonuses page, including post-login `next` from the coins pill.
 */
export function ProfileDesktopSheetRedirect({
  locale,
  sheetOpen,
}: ProfileDesktopSheetRedirectProps) {
  const isDesktop = useDesktopChrome();
  const router = useRouter();

  useEffect(() => {
    if (!sheetOpen || !isDesktop) {
      return;
    }
    router.replace(profileBonusesPageHref(locale));
  }, [isDesktop, locale, router, sheetOpen]);

  return null;
}
