"use client";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
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
import type { AdminOrderDrawerControls } from "@/features/orders/ui/admin-order-drawer-controls";

type OrderDetailsDrawerSummaryProps = {
  detail: AdminOrderDetailView;
  adminControls?: AdminOrderDrawerControls;
};

/**
 * Customer sheet: status pills + notices.
 * Admin sheet: notices only (status controls live in the header).
 */
export function OrderDetailsDrawerSummary({
  detail,
  adminControls,
}: OrderDetailsDrawerSummaryProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const attempts = detail.paymentAttempts ?? [];

  const showCustomerStatuses = !adminControls;
  const showReviewNotice =
    !adminControls &&
    detail.status === "REQUIRES_REVIEW" &&
    detail.paymentStatus === "CAPTURED";
  const showAttempts = attempts.length > 1;

  if (!showCustomerStatuses && !showReviewNotice && !showAttempts) {
    return null;
  }

  return (
    <section className={ORDER_DETAIL_CARD}>
      {showCustomerStatuses ? (
        <>
          <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.statusSection}</h3>
          <div className="flex flex-wrap items-center gap-2">
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
        </>
      ) : null}
      {showReviewNotice ? (
        <p
          className={`text-sm text-amber-800 ${showCustomerStatuses ? "mt-2" : ""}`}
          role="status"
        >
          {drawer.customerReviewNotice}
        </p>
      ) : null}
      {showAttempts ? (
        <ul
          className={`space-y-1 text-sm text-gray-600 ${
            showCustomerStatuses || showReviewNotice ? "mt-3" : ""
          }`}
        >
          {attempts.map((attempt) => (
            <li key={`${attempt.provider}-${attempt.attemptNumber}`}>
              {formatAdminMessage(drawer.paymentAttempt, {
                number: String(attempt.attemptNumber),
                status: adminPaymentStatusLabel(
                  attempt.status,
                  dictionary.orders.paymentStatus,
                ),
              })}
              {attempt.isLatest ? drawer.paymentAttemptLatest : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
