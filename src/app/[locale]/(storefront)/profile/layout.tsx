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

/**
 * Desktop: sidebar keeps its full natural height. The page column is capped
 * to that height and scrolls internally; the storefront footer stays below.
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
        className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[var(--profile-sidebar-width)_minmax(0,1fr)] lg:gap-10"
        style={
          {
            "--profile-sidebar-width": `${PROFILE_SIDEBAR_WIDTH_PX}px`,
          } as React.CSSProperties
        }
      >
        <div className="hidden lg:block">
          <ProfileSidebar
            locale={rawLocale}
            user={user}
            dictionary={dictionary.profile}
          />
        </div>
        <div className="min-h-0 min-w-0 lg:h-0 lg:min-h-full lg:self-stretch lg:overflow-y-auto lg:overscroll-contain">
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
