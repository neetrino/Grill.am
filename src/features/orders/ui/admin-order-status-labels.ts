import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type OrderStatusLabels = AdminDictionary["orders"]["status"];
type PaymentStatusLabels = AdminDictionary["orders"]["paymentStatus"];

/**
 * Maps DB order status to admin dictionary label (aliases match domain labels).
 */
export function adminOrderStatusLabel(
  status: string,
  labels: OrderStatusLabels,
): string {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
      return labels.pending;
    case "PROCESSING":
    case "SHIPPED":
      return labels.processing;
    case "DELIVERED":
      return labels.completed;
    case "CANCELLED":
    case "REFUNDED":
      return labels.cancelled;
    case "REQUIRES_REVIEW":
      return labels.requiresReview;
    default:
      return status;
  }
}

/**
 * Maps DB payment status to admin dictionary label (aliases match domain labels).
 */
export function adminPaymentStatusLabel(
  status: string,
  labels: PaymentStatusLabels,
): string {
  switch (status) {
    case "CAPTURED":
      return labels.paid;
    case "PENDING":
      return labels.pending;
    case "AUTHORIZED":
      return labels.authorized ?? labels.pending;
    case "FAILED":
      return labels.failed;
    case "REFUNDED":
      return labels.refunded;
    case "CANCELLED":
      return labels.cancelled;
    default:
      return status;
  }
}
