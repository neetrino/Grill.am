"use client";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerTotalsProps = {
  detail: AdminOrderDetailView;
};

function formatGrillCoinAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.floor(amount) : 0;
  const formatted = Math.abs(safe).toLocaleString("en-US");
  if (safe > 0) {
    return `+${formatted}`;
  }
  if (safe < 0) {
    return `−${formatted}`;
  }
  return "+0";
}

/** Sticky sheet footer totals — flush rows, Grill Coin above total. */
export function OrderDetailsDrawerTotals({
  detail,
}: OrderDetailsDrawerTotalsProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  const shippingLabel = detail.isPickup
    ? drawer.freePickup
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  return (
    <section aria-label={drawer.summarySection}>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-600">{drawer.subtotal}</dt>
          <dd className="font-medium tabular-nums text-gray-900">
            {formatOrderDrawerMoney(detail.subtotalAmount, detail.baseCurrency)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-600">{drawer.delivery}</dt>
          <dd className="font-medium text-gray-900">{shippingLabel}</dd>
        </div>

        {detail.discountAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-600">
              {drawer.couponDiscount}
              {detail.couponCode ? ` (${detail.couponCode})` : ""}
            </dt>
            <dd className="font-medium tabular-nums text-emerald-700">
              −
              {formatOrderDrawerMoney(
                detail.discountAmount,
                detail.baseCurrency,
              )}
            </dd>
          </div>
        ) : null}

        {detail.bonusSpentAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-600">{drawer.bonusSpent}</dt>
            <dd className="font-medium tabular-nums text-emerald-700">
              −
              {formatOrderDrawerMoney(
                detail.bonusSpentAmount,
                detail.baseCurrency,
              )}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-600">
            {dictionary.orders.list.paymentMethod}
          </dt>
          <dd className="font-medium text-gray-900">{detail.paymentMethod}</dd>
        </div>

        {detail.cashChangeAmount != null && detail.cashChangeAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-600">{drawer.prepareChange}</dt>
            <dd className="font-semibold tabular-nums text-amber-800">
              {formatOrderDrawerMoney(
                detail.cashChangeAmount,
                detail.baseCurrency,
              )}
            </dd>
          </div>
        ) : null}

        {detail.bonusEarnedAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 font-semibold text-gray-900">
              <HeaderCoinsIcon className="size-5 shrink-0" />
              {drawer.bonusEarned}
            </dt>
            <dd className="font-semibold tabular-nums text-emerald-700">
              {formatGrillCoinAmount(detail.bonusEarnedAmount)}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-2">
          <dt className="text-base font-bold text-gray-900">{drawer.total}</dt>
          <dd className="text-base font-bold tabular-nums text-gray-900">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
