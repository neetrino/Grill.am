import { notFound } from "next/navigation";

import { logoutAction } from "@/features/auth/logout-action";
import { getProfileDashboard } from "@/features/profile/application/dashboard-queries";
import { ProfileDashboardView } from "@/features/profile/ui/ProfileDashboardView";
import { ProfileMobileMenu } from "@/features/profile/ui/ProfileMobileMenu";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const { stats, recentOrders } = await getProfileDashboard(user.id);
  const logoutWithLocale = logoutAction.bind(null, locale);
  const dashboardProps = {
    locale,
    stats,
    recentOrders,
    dictionary: dictionary.profile,
    adminDictionary: dictionary.admin,
  } as const;

  return (
    <>
      <ProfileMobileMenu
        locale={locale}
        user={user}
        dictionary={dictionary.profile}
        logoutAction={logoutWithLocale}
        dashboardContent={<ProfileDashboardView {...dashboardProps} />}
      />
      <div className="hidden lg:block">
        <ProfileDashboardView {...dashboardProps} />
      </div>
    </>
  );
}
