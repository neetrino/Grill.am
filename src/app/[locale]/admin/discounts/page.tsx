import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { getAdminDiscountsBoard } from "@/features/promotions/application/discounts-board";
import { AdminDiscountsView } from "@/features/promotions/ui/AdminDiscountsView";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminDiscountsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDiscountsPage({
  params,
}: AdminDiscountsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getDictionary(locale).admin.discounts;
  const board = await getAdminDiscountsBoard(locale);

  return (
    <section className="w-full">
      <div className="mb-6">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
      </div>

      <AdminDiscountsView locale={locale} board={board} />
    </section>
  );
}
