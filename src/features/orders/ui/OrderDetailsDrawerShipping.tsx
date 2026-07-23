"use client";

import { MapPin } from "lucide-react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BADGE,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { adminPaymentStatusLabel } from "@/features/orders/ui/admin-order-status-labels";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerShippingProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerShipping({
  detail,
}: OrderDetailsDrawerShippingProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <div className="grid gap-8 border-b border-gray-200 px-6 py-5 md:grid-cols-2">
      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {drawer.shippingAddress}
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{drawer.shippingMethod}:</dt>
            <dd className="font-medium text-gray-900">{detail.shippingMethod}</dd>
          </div>
          {detail.isPickup ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{drawer.pickupStore}:</dt>
              <dd className="font-medium text-gray-900">{detail.storeName}</dd>
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
              aria-hidden
            />
            <dd className="font-medium text-gray-900">{detail.addressLine}</dd>
          </div>
          {detail.addressHint ? (
            <p className="text-xs text-gray-500">{detail.addressHint}</p>
          ) : null}
        </dl>
      </section>

      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {drawer.payment}
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{drawer.method}:</dt>
            <dd className="font-medium text-gray-900">{detail.paymentMethod}</dd>
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
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{drawer.status}:</dt>
            <dd>
              <span
                className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(detail.paymentStatus)}`}
              >
                {adminPaymentStatusLabel(
                  detail.paymentStatus,
                  dictionary.orders.paymentStatus,
                )}
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
