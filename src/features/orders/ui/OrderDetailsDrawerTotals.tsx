"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerTotalsProps = {
  detail: AdminOrderDetailView;
};

/** Money summary card — subtotal, shipping, total. */
export function OrderDetailsDrawerTotals({
  detail,
}: OrderDetailsDrawerTotalsProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  const shippingLabel = detail.isPickup
    ? drawer.freePickup
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.summarySection}</h3>
      <dl className="space-y-3 text-sm">
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
            <dd className="font-medium tabular-nums text-green-700">
              −
              {formatOrderDrawerMoney(
                detail.discountAmount,
                detail.baseCurrency,
              )}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
          <dt className="text-base font-bold text-gray-900">{drawer.total}</dt>
          <dd className="text-base font-bold tabular-nums text-gray-900">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
