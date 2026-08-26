import type { CustomerAssignedCoupon } from "@/features/promotions/application/list-customer-assigned-coupons";
import type { CustomerCouponRedemption } from "@/features/promotions/application/list-customer-coupon-history";
import { CustomerAssignedPromoCodesView } from "@/features/promotions/ui/CustomerAssignedPromoCodesView";
import { CustomerPromoCodesView } from "@/features/promotions/ui/CustomerPromoCodesView";
import {
  toAssignedPromoCodesLabels,
  toCustomerPromoCodesLabels,
} from "@/features/promotions/ui/customer-promo-codes-labels";
import { ProfilePageTitle } from "@/features/profile/ui/ProfilePageTitle";
import type { ProfileDictionary } from "@/lib/i18n/get-dictionary";

type CustomerPromoCodesPageContentProps = {
  locale: string;
  assigned: CustomerAssignedCoupon[];
  rows: CustomerCouponRedemption[];
  copy: ProfileDictionary["promoCodes"];
};

export function CustomerPromoCodesPageContent({
  locale,
  assigned,
  rows,
  copy,
}: CustomerPromoCodesPageContentProps) {
  const historyLabels = toCustomerPromoCodesLabels(copy);

  return (
    <div className="space-y-8">
      <ProfilePageTitle>{copy.nav}</ProfilePageTitle>

      <CustomerAssignedPromoCodesView
        locale={locale}
        coupons={assigned}
        labels={toAssignedPromoCodesLabels(copy)}
      />

      <CustomerPromoCodesView
        locale={locale}
        rows={rows}
        labels={historyLabels}
      />
    </div>
  );
}
