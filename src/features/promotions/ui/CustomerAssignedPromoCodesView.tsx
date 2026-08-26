import { TicketPercent } from "lucide-react";

import {
  PROFILE_CARD_FLAT_CLASS,
  PROFILE_ICON_TONE,
} from "@/features/profile/ui/profile-ui";
import { ProfilePageTitle } from "@/features/profile/ui/ProfilePageTitle";
import type { CustomerAssignedCoupon } from "@/features/promotions/application/list-customer-assigned-coupons";
import { formatCouponOffer } from "@/features/promotions/domain/format-coupon-offer";
import { CopyPromoCodeButton } from "@/features/promotions/ui/CopyPromoCodeButton";
import { formatShortDate } from "@/lib/i18n/format-date";
import { defaultCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

export type CustomerAssignedPromoCodesLabels = {
  title: string;
  description: string;
  empty: string;
  emptyHint: string;
  copy: string;
  copied: string;
  validUntil: string;
  noExpiry: string;
  minOrder: string;
};

type CustomerAssignedPromoCodesViewProps = {
  locale: string;
  coupons: CustomerAssignedCoupon[];
  labels: CustomerAssignedPromoCodesLabels;
};

export function CustomerAssignedPromoCodesView({
  locale,
  coupons,
  labels,
}: CustomerAssignedPromoCodesViewProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <ProfilePageTitle as="h2" size="section">
          {labels.title}
        </ProfilePageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
          {labels.description}
        </p>
      </header>

      {coupons.length === 0 ? (
        <div className="space-y-1 py-2">
          <p className="text-sm font-medium text-gray-800">{labels.empty}</p>
          <p className="text-sm text-gray-600">{labels.emptyHint}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {coupons.map((coupon) => (
            <li key={coupon.id}>
              <AssignedPromoCodeCard
                locale={locale}
                coupon={coupon}
                labels={labels}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AssignedPromoCodeCard({
  locale,
  coupon,
  labels,
}: {
  locale: string;
  coupon: CustomerAssignedCoupon;
  labels: CustomerAssignedPromoCodesLabels;
}) {
  const offer = formatCouponOffer(
    coupon.discountType,
    coupon.discountValue,
    defaultCurrency,
    locale,
  );
  const validUntil =
    coupon.endsAt === null
      ? labels.noExpiry
      : `${labels.validUntil} ${formatShortDate(coupon.endsAt, locale)}`;
  const minOrder =
    coupon.minimumOrderAmount === null
      ? null
      : `${labels.minOrder} ${formatMoneyAmount(coupon.minimumOrderAmount, defaultCurrency, locale)}`;

  return (
    <article
      className={`flex h-full flex-col p-4 sm:p-5 ${PROFILE_CARD_FLAT_CLASS} border border-gray-100`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: PROFILE_ICON_TONE.background,
              color: PROFILE_ICON_TONE.foreground,
            }}
          >
            <TicketPercent className="h-5 w-5" aria-hidden />
          </div>
          <p className="truncate font-mono text-lg font-semibold tracking-wide text-gray-900">
            {coupon.code}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <p className="text-lg font-bold text-brand-red">{offer}</p>
          <CopyPromoCodeButton
            code={coupon.code}
            copyLabel={labels.copy}
            copiedLabel={labels.copied}
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600">{validUntil}</p>
      {minOrder ? <p className="text-sm text-gray-600">{minOrder}</p> : null}
    </article>
  );
}
