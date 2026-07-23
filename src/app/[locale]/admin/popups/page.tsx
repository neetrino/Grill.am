import { notFound } from "next/navigation";

import { listAdminPopups } from "@/features/popups/application/queries";
import { AdminPopupsView } from "@/features/popups/ui/AdminPopupsView";
import { isLocale } from "@/lib/i18n/config";

type AdminPopupsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPopupsPage({
  params,
}: AdminPopupsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const items = await listAdminPopups();

  return <AdminPopupsView locale={locale} items={items} />;
}
