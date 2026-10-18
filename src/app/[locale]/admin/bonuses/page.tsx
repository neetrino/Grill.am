import { notFound } from "next/navigation";

import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  getAdminCategoryBonusBoard,
  getAdminProductBonusBoard,
} from "@/features/loyalty/application/product-bonus-board";
import { AdminBonusesTargetsPanel } from "@/features/loyalty/ui/AdminBonusesTargetsPanel";
import { AdminLoyaltySettingsForm } from "@/features/loyalty/ui/AdminLoyaltySettingsForm";
import { getStoreLoyalty } from "@/features/settings/application/queries";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminBonusesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminBonusesPage({
  params,
}: AdminBonusesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getDictionary(locale).admin.bonuses;
  const [loyalty, products, categories] = await Promise.all([
    getStoreLoyalty(),
    getAdminProductBonusBoard(locale),
    getAdminCategoryBonusBoard(locale),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
      </div>
      <AdminLoyaltySettingsForm locale={locale} initial={loyalty} />
      <AdminBonusesTargetsPanel
        locale={locale}
        categories={categories}
        products={products}
      />
    </section>
  );
}
