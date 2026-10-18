"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";

type OrderDetailsDrawerShippingProps = {
  detail: AdminOrderDetailView;
  /** When true, only the delivery-method lines are shown (customer sheet). */
  compact?: boolean;
};

/** Shipping card — pickup store, or delivery method + address in one block. */
export function OrderDetailsDrawerShipping({
  detail,
  compact = false,
}: OrderDetailsDrawerShippingProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const methodLabel = detail.isPickup
    ? drawer.pickupMethod
    : (detail.deliveryLabel ?? detail.shippingMethod).replace(
        /^Delivery\b/u,
        drawer.delivery,
      );

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.shippingMethod}</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-1">
          <dt className="text-gray-500">{drawer.method}:</dt>
          <dd className="font-medium text-gray-900">{methodLabel}</dd>
        </div>
        {detail.isPickup ? (
          <div className="flex flex-wrap items-baseline gap-x-1">
            <dt className="text-gray-500">{drawer.pickupStore}:</dt>
            <dd className="font-medium text-gray-900">
              {detail.addressLine || detail.storeName}
            </dd>
          </div>
        ) : null}
        {!detail.isPickup && !compact ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-1">
              <dt className="text-gray-500">{drawer.address}:</dt>
              <dd className="font-medium text-gray-900">{detail.addressLine}</dd>
            </div>
            {detail.addressHint ? (
              <p className="text-xs text-gray-500">{detail.addressHint}</p>
            ) : null}
          </>
        ) : null}
      </dl>
    </section>
  );
}
