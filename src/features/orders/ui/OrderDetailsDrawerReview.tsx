"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ORDER_DETAIL_CARD, ORDER_DETAIL_SECTION_TITLE } from "@/features/orders/ui/order-detail-card-classes";
import { ResolvePaymentReviewForm } from "@/features/payments/ui/ResolvePaymentReviewForm";
import type { AdminOrderDrawerControls } from "@/features/orders/ui/admin-order-drawer-controls";

type OrderDetailsDrawerReviewProps = {
  detailStatus: string;
  paymentStatus: string;
  orderNumber: string;
  adminControls: AdminOrderDrawerControls;
};

/** Staff review resolution — only when fulfillment is blocked after capture. */
export function OrderDetailsDrawerReview({
  detailStatus,
  paymentStatus,
  orderNumber,
  adminControls,
}: OrderDetailsDrawerReviewProps) {
  const dictionary = useAdminDictionary();
  const banner = dictionary.orders.reviewBanner;

  if (detailStatus !== "REQUIRES_REVIEW" || paymentStatus !== "CAPTURED") {
    return null;
  }

  return (
    <section className={`${ORDER_DETAIL_CARD} !border-amber-200 !bg-amber-50`}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{banner.title}</h3>
      <p className="mb-3 text-sm text-amber-950">{banner.body}</p>
      <ResolvePaymentReviewForm
        locale={adminControls.locale}
        orderNumber={orderNumber}
        onResolved={adminControls.onStatusUpdated}
      />
    </section>
  );
}
