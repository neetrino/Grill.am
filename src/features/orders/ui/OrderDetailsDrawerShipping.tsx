"use client";

import { MapPin } from "lucide-react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerShippingProps = {
  detail: AdminOrderDetailView;
  /** When true, only the delivery-method card is shown (customer sheet). */
  compact?: boolean;
};

/**
 * Delivery method card; optionally expands with address + payment for admin.
 */
export function OrderDetailsDrawerShipping({
  detail,
  compact = false,
}: OrderDetailsDrawerShippingProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const methodLabel = detail.isPickup
    ? drawer.pickupMethod
    : (detail.deliveryLabel ?? detail.shippingMethod);

  return (
    <>
      <section className={ORDER_DETAIL_CARD}>
        <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.shippingMethod}</h3>
        <p className="text-sm text-gray-700">
          <span className="text-gray-500">{drawer.method}: </span>
          <span className="font-medium text-gray-900">{methodLabel}</span>
        </p>
        {detail.isPickup && detail.storeName ? (
          <p className="mt-2 text-sm text-gray-600">
            {drawer.pickupStore}: {detail.storeName}
          </p>
        ) : null}
      </section>

      {compact ? null : (
        <>
          <section className={ORDER_DETAIL_CARD}>
            <h3 className={ORDER_DETAIL_SECTION_TITLE}>
              {drawer.shippingAddress}
            </h3>
            <div className="flex items-start gap-2 text-sm">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                aria-hidden
              />
              <p className="font-medium text-gray-900">{detail.addressLine}</p>
            </div>
            {detail.addressHint ? (
              <p className="mt-2 text-xs text-gray-500">{detail.addressHint}</p>
            ) : null}
          </section>

          <section className={ORDER_DETAIL_CARD}>
            <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.payment}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-gray-500">{drawer.method}:</dt>
                <dd className="font-medium text-gray-900">
                  {detail.paymentMethod}
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-gray-500">{drawer.amount}:</dt>
                <dd className="font-medium text-gray-900">
                  {formatOrderDrawerMoney(
                    detail.paymentAmount,
                    detail.baseCurrency,
                  )}
                </dd>
              </div>
              {detail.cashTenderedAmount != null ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <dt className="text-gray-500">{drawer.customerPaysWith}:</dt>
                    <dd className="font-medium text-gray-900">
                      {formatOrderDrawerMoney(
                        detail.cashTenderedAmount,
                        detail.baseCurrency,
                      )}
                    </dd>
                  </div>
                  {detail.cashChangeAmount != null &&
                  detail.cashChangeAmount > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-2">
                      <dt className="text-gray-500">{drawer.prepareChange}:</dt>
                      <dd className="font-semibold text-amber-800">
                        {formatOrderDrawerMoney(
                          detail.cashChangeAmount,
                          detail.baseCurrency,
                        )}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>
          </section>

          <section className={ORDER_DETAIL_CARD}>
            <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.customer}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-gray-500">{drawer.name}:</dt>
                <dd className="font-medium text-gray-900">{detail.contactName}</dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-gray-500">{drawer.phone}:</dt>
                <dd className="font-medium text-gray-900">
                  {detail.contactPhone}
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-gray-500">{drawer.email}:</dt>
                <dd className="font-medium text-gray-900">
                  {detail.contactEmail}
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </>
  );
}
