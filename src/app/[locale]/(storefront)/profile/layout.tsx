import { notFound } from "next/navigation";

import { ProfileContentScroller } from "@/features/profile/ui/ProfileContentScroller";
import { ProfileMobileBackLink } from "@/features/profile/ui/ProfileMobileBackLink";
import { ProfileSidebar } from "@/features/profile/ui/ProfileSidebar";
import {
  PROFILE_PAGE_BG_CLASS,
  PROFILE_SIDEBAR_WIDTH_PX,
  PROFILE_STICKY_BAND_CLASS,
} from "@/features/profile/ui/profile-ui";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Desktop: both columns stick in a viewport band under the header.
 * Content scrolls inside the right column (scrollbar hidden). When that
 * scroll ends, further wheel/trackpad scroll chains to the page so the
 * footer can be reached — same as Kamancha profile.
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
      className={`storefront-bleed -mt-10 mb-[-2.5rem] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-24 sm:px-6 lg:min-h-[calc(100dvh-var(--storefront-header-offset))] lg:px-8 lg:pt-7 lg:pb-7 ${PROFILE_PAGE_BG_CLASS}`}
    >
      <div
        className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(var(--profile-sidebar-width),max-content)_minmax(0,1fr)] lg:gap-10"
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
        <ProfileContentScroller>
          <ProfileMobileBackLink
            locale={rawLocale}
            label={dictionary.profile.title}
          />
          {children}
        </ProfileContentScroller>
      </div>
    </div>
  );
}
