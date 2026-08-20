"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
  ORDER_DETAIL_STATUS_PILL,
} from "@/features/orders/ui/order-detail-card-classes";
import { AdminInlineStatusSelect } from "@/features/orders/ui/AdminInlineStatusSelect";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import type { AdminOrderDrawerControls } from "@/features/orders/ui/admin-order-drawer-controls";

type OrderDetailsDrawerSummaryProps = {
  detail: AdminOrderDetailView;
  adminControls?: AdminOrderDrawerControls;
};

/** Order status card — badges or admin status selects + payment attempts. */
export function OrderDetailsDrawerSummary({
  detail,
  adminControls,
}: OrderDetailsDrawerSummaryProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const attempts = detail.paymentAttempts ?? [];

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.statusSection}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {adminControls ? (
          <>
            <AdminInlineStatusSelect
              locale={adminControls.locale}
              orderNumber={detail.orderNumber}
              kind="order"
              value={detail.status}
              onSuccess={adminControls.onStatusUpdated}
            />
            <AdminInlineStatusSelect
              locale={adminControls.locale}
              orderNumber={detail.orderNumber}
              kind="payment"
              value={detail.paymentStatus}
              onSuccess={adminControls.onStatusUpdated}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {detail.paymentMethod} ·{" "}
        {detail.paymentAmount.toLocaleString("en-US")} {detail.baseCurrency}
      </p>
      {!adminControls &&
      detail.status === "REQUIRES_REVIEW" &&
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
