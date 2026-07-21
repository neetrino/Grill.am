import { notFound } from "next/navigation";

import { ProfileSidebar } from "@/features/profile/ui/ProfileSidebar";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

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
    <div className="grid grid-cols-1 items-start gap-6 pb-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <ProfileSidebar
        locale={rawLocale}
        user={user}
        dictionary={dictionary.profile}
      />
      <div className="min-h-0 min-w-0 overflow-visible">{children}</div>
    </div>
  );
}
