import Link from "next/link";
import { notFound } from "next/navigation";

import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  getAdminPromotionById,
  listPromotionTargetOptions,
} from "@/features/promotions/application/queries";
import { PromotionForm } from "@/features/promotions/ui/PromotionForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminDiscountDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}

export default async function AdminDiscountDetailPage({
  params,
}: AdminDiscountDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const [promo, targets] = await Promise.all([
    getAdminPromotionById(id),
    listPromotionTargetOptions(),
  ]);

  if (!promo || promo.kind !== "AUTOMATIC") {
    notFound();
  }

  const admin = getDictionary(locale).admin;
  const discounts = admin.discounts;
  const coupons = admin.coupons;

  return (
    <section>
      <div className="mb-6">
        <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
          <Link
            href={`/${locale}/admin/discounts`}
            className="font-medium text-gray-700 hover:underline"
          >
            {discounts.title}
          </Link>
        </p>
        <AdminPageTitle>{discounts.automaticDiscount}</AdminPageTitle>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
          {fillTemplate(coupons.usedTimes, {
            count: String(promo.usedCount),
          })}
        </p>
      </div>

      <PromotionForm
        locale={locale}
        mode="edit"
        promotionId={promo.id}
        initialKind="AUTOMATIC"
        lockKind
        targets={targets}
        redirectTo={`/${locale}/admin/discounts`}
        defaults={{
          code: promo.code,
          productId: promo.productId,
          categoryId: promo.categoryId,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          maxDiscountAmount: promo.maxDiscountAmount,
          minimumOrderAmount: promo.minimumOrderAmount,
          totalUsageLimit: promo.totalUsageLimit,
          perUserUsageLimit: promo.perUserUsageLimit,
          priority: promo.priority,
          allowStacking: promo.allowStacking,
          isActive: promo.isActive,
          startsAt: promo.startsAt,
          endsAt: promo.endsAt,
        }}
      />
    </section>
  );
}
