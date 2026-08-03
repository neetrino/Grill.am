import { notFound } from "next/navigation";

import { ProfileMobileBackLink } from "@/features/profile/ui/ProfileMobileBackLink";
import { ProfileSidebar } from "@/features/profile/ui/ProfileSidebar";
import { PROFILE_SIDEBAR_WIDTH_PX } from "@/features/profile/ui/profile-ui";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Sticky rail under the header — extra top gap; leaves room at the bottom. */
const PROFILE_SIDEBAR_STICKY_CLASS =
  "sticky top-[calc(var(--storefront-header-offset)+1.75rem)] z-10 h-[calc(100dvh-var(--storefront-header-offset)-3.5rem)] max-h-[calc(100dvh-var(--storefront-header-offset)-3.5rem)] self-start";

/**
 * Desktop sidebar sticks in the visible band under the header;
 * page + footer keep scrolling. Nav scrolls inside the card if needed.
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
      className="grid grid-cols-1 items-start gap-6 pb-10 lg:grid-cols-[var(--profile-sidebar-width)_minmax(0,1fr)] lg:gap-10"
      style={
        {
          "--profile-sidebar-width": `${PROFILE_SIDEBAR_WIDTH_PX}px`,
        } as React.CSSProperties
      }
    >
      <div className="hidden lg:block">
        <div className={PROFILE_SIDEBAR_STICKY_CLASS}>
          <ProfileSidebar
            locale={rawLocale}
            user={user}
            dictionary={dictionary.profile}
          />
        </div>
      </div>
      <div className="min-h-0 min-w-0 overflow-visible">
        <ProfileMobileBackLink
          locale={rawLocale}
          label={dictionary.profile.title}
        />
        {children}
      </div>
    </div>
  );
}
