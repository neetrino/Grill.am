"use client";

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
          <dt className="font-semibold text-emerald-800">
            {drawer.bonusEarned}
          </dt>
          <dd className="font-semibold tabular-nums text-emerald-700">
            {formatGrillCoinAmount(detail.bonusEarnedAmount)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <dt className="text-base font-bold text-gray-900">{drawer.total}</dt>
          <dd className="text-base font-bold tabular-nums text-gray-900">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
