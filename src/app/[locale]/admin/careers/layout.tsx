import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { AdminCareersTabs } from "@/features/careers/ui/AdminCareersTabs";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminCareersLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Keeps the careers tabs mounted across postings / applications navigation so
 * only the page content re-renders (instant switch, persistent underline).
 */
export default async function AdminCareersLayout({
  children,
  params,
}: AdminCareersLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const careers = getDictionary(locale).admin.careers;

  return (
    <section>
      <AdminPageTitle className="mb-6">{careers.title}</AdminPageTitle>
      <AdminCareersTabs
        locale={locale}
        postingsLabel={careers.tabs.postings}
        applicationsLabel={careers.tabs.applications}
      />
      {children}
    </section>
  );
}
