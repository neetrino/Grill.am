"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
  ORDER_DETAIL_STATUS_PILL,
} from "@/features/orders/ui/order-detail-card-classes";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";

type OrderDetailsDrawerSummaryProps = {
  detail: AdminOrderDetailView;
};

/** Order status card — badges only (matches order-sheet design). */
export function OrderDetailsDrawerSummary({
  detail,
}: OrderDetailsDrawerSummaryProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.statusSection}</h3>
      <div className="flex flex-wrap gap-2">
        <span className={ORDER_DETAIL_STATUS_PILL}>
          {adminOrderStatusLabel(detail.status, dictionary.orders.status)}
        </span>
        <span className={ORDER_DETAIL_STATUS_PILL}>
          {drawer.payment}:{" "}
          {adminPaymentStatusLabel(
            detail.paymentStatus,
            dictionary.orders.paymentStatus,
          )}
        </span>
      </div>
    </section>
  );
}
