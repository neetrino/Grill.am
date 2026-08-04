import { notFound } from "next/navigation";

import { ProfileMobileBackLink } from "@/features/profile/ui/ProfileMobileBackLink";
import { ProfileSidebar } from "@/features/profile/ui/ProfileSidebar";
import {
  PROFILE_PAGE_BG_CLASS,
  PROFILE_SIDEBAR_WIDTH_PX,
} from "@/features/profile/ui/profile-ui";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Shared sticky band under the header for both profile columns. */
const PROFILE_STICKY_BAND_CLASS =
  "lg:sticky lg:top-[calc(var(--storefront-header-offset)+1.75rem)] lg:z-10 lg:h-[calc(100dvh/var(--desktop-layout-scale)-var(--storefront-header-offset)-3.5rem)] lg:max-h-[calc(100dvh/var(--desktop-layout-scale)-var(--storefront-header-offset)-3.5rem)] lg:self-start";

/**
 * Desktop: sidebar + content stay in the visible band; content scrolls inside.
 * Footer remains below and can still be reached by page scroll.
 */
export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const user = await requireUser(rawLocale);
  const dictionary = getDictionary(rawLocale);

  return (
    <div
      className={`storefront-bleed -mt-6 mb-[-2.5rem] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-24 sm:px-6 md:pt-10 md:pb-10 lg:px-8 ${PROFILE_PAGE_BG_CLASS}`}
    >
      <div
        className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[var(--profile-sidebar-width)_minmax(0,1fr)] lg:gap-10"
        style={
          {
            "--profile-sidebar-width": `${PROFILE_SIDEBAR_WIDTH_PX}px`,
          } as React.CSSProperties
        }
      >
        <div className={`hidden lg:block ${PROFILE_STICKY_BAND_CLASS}`}>
          <ProfileSidebar
            locale={rawLocale}
            user={user}
            dictionary={dictionary.profile}
          />
        </div>
        <div
          className={`min-h-0 min-w-0 overflow-visible lg:overflow-y-auto lg:overscroll-contain ${PROFILE_STICKY_BAND_CLASS}`}
        >
          <ProfileMobileBackLink
            locale={rawLocale}
            label={dictionary.profile.title}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
