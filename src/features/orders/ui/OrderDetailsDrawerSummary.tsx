"use client";

import type { ReactNode } from "react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerSummaryProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerSummary({
  detail,
}: OrderDetailsDrawerSummaryProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <div className="grid gap-8 border-b border-gray-200 px-6 py-5 md:grid-cols-2">
      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {drawer.summary}
        </h3>
        <dl className="space-y-3 text-sm">
          <DetailRow
            label={`${drawer.orderNumber}:`}
            value={detail.orderNumber}
          />
          <DetailRow
            label={`${drawer.total}:`}
            value={formatOrderDrawerMoney(
              detail.totalAmount,
              detail.baseCurrency,
            )}
          />
          <DetailRow
            label={`${drawer.status}:`}
            value={
              <span
                className={`${ADMIN_BADGE} ${orderStatusBadgeClass(detail.status)}`}
              >
                {adminOrderStatusLabel(detail.status, dictionary.orders.status)}
              </span>
            }
          />
          <DetailRow
            label={`${drawer.payment}:`}
            value={
              <span
                className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(detail.paymentStatus)}`}
              >
                {adminPaymentStatusLabel(
                  detail.paymentStatus,
                  dictionary.orders.paymentStatus,
                )}
              </span>
            }
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {drawer.customer}
        </h3>
        <dl className="space-y-3 text-sm">
          <DetailRow label={`${drawer.name}:`} value={detail.contactName} />
          <DetailRow
            label={`${drawer.phone}:`}
            value={detail.contactPhone}
          />
          <DetailRow label={`${drawer.email}:`} value={detail.contactEmail} />
        </dl>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
