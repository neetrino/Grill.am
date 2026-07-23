"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerTotalsProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerTotals({
  detail,
}: OrderDetailsDrawerTotalsProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  const shippingLabel = detail.isPickup
    ? drawer.freePickup
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  const discountLabel =
    detail.discountAmount > 0
      ? `−${formatOrderDrawerMoney(detail.discountAmount, detail.baseCurrency)}`
      : formatOrderDrawerMoney(0, detail.baseCurrency);

  return (
    <div className="border-b border-gray-200 px-6 py-5">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">{drawer.subtotal}</span>
          <span className="font-medium text-gray-900">
            {formatOrderDrawerMoney(detail.subtotalAmount, detail.baseCurrency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">
            {drawer.delivery}
            {!detail.isPickup && detail.deliveryLabel
              ? ` (${detail.deliveryLabel})`
              : ""}
          </span>
          <span className="font-medium text-gray-900">{shippingLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">
            {drawer.couponDiscount}
            {detail.couponCode ? ` (${detail.couponCode})` : ""}
          </span>
          <span
            className={`font-medium ${
              detail.discountAmount > 0 ? "text-green-700" : "text-gray-900"
            }`}
          >
            {discountLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
          <span className="text-base font-semibold text-gray-900">
            {drawer.total}
          </span>
          <span className="text-base font-semibold text-gray-900">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
}
