import { notFound } from "next/navigation";

import { listAdminJobPostings } from "@/features/careers/application/queries";
import { AdminCareersView } from "@/features/careers/ui/AdminCareersView";
import { isLocale } from "@/lib/i18n/config";

type AdminCareersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCareersPage({
  params,
}: AdminCareersPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const postings = await listAdminJobPostings(locale);

  return <AdminCareersView locale={locale} postings={postings} />;
}
