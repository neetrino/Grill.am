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

/** Order status card — badges + customer-safe payment attempt history. */
export function OrderDetailsDrawerSummary({
  detail,
}: OrderDetailsDrawerSummaryProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const attempts = detail.paymentAttempts ?? [];

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
      <p className="mt-3 text-sm text-gray-600">
        {detail.paymentMethod} ·{" "}
        {detail.paymentAmount.toLocaleString("en-US")} {detail.baseCurrency}
      </p>
      {detail.status === "REQUIRES_REVIEW" &&
      detail.paymentStatus === "CAPTURED" ? (
        <p className="mt-2 text-sm text-amber-800" role="status">
          Payment was received. The order is under review — support will
          contact you if needed.
        </p>
      ) : null}
      {attempts.length > 1 ? (
        <ul className="mt-3 space-y-1 text-sm text-gray-600">
          {attempts.map((attempt) => (
            <li key={`${attempt.provider}-${attempt.attemptNumber}`}>
              Attempt {attempt.attemptNumber} — {attempt.status}
              {attempt.isLatest ? " (latest)" : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
