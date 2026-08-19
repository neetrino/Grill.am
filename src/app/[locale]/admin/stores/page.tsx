import { notFound } from "next/navigation";

import { listAdminStores } from "@/features/stores/application/queries";
import { AdminStoresView } from "@/features/stores/ui/AdminStoresView";
import { isLocale } from "@/lib/i18n/config";

type AdminStoresPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminStoresPage({
  params,
}: AdminStoresPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const stores = await listAdminStores(locale);

  return <AdminStoresView locale={locale} stores={stores} />;
}
