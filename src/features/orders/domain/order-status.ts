/** Canonical order fulfillment statuses from the database enum. */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "REQUIRES_REVIEW",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Admin orders table dropdown options (label → DB status). */
export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DELIVERED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REQUIRES_REVIEW", label: "Requires review" },
] as const satisfies ReadonlyArray<{ value: OrderStatus; label: string }>;

/**
 * Allowed admin-driven fulfillment transitions.
 * Admin list allows free moves among Pending / Processing / Confirmed / Completed / Cancelled.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [
    "PROCESSING",
    "CONFIRMED",
    "DELIVERED",
    "CANCELLED",
    "REQUIRES_REVIEW",
  ],
  CONFIRMED: [
    "PENDING",
    "PROCESSING",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
    "REQUIRES_REVIEW",
  ],
  PROCESSING: [
    "PENDING",
    "CONFIRMED",
    "DELIVERED",
    "CANCELLED",
    "SHIPPED",
    "REQUIRES_REVIEW",
  ],
  SHIPPED: ["DELIVERED", "CONFIRMED", "CANCELLED", "PROCESSING"],
  DELIVERED: ["PENDING", "PROCESSING", "CONFIRMED", "CANCELLED", "REFUNDED"],
  CANCELLED: ["PENDING", "PROCESSING", "CONFIRMED", "DELIVERED"],
  REFUNDED: ["PENDING"],
  REQUIRES_REVIEW: [
    "PROCESSING",
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "DELIVERED",
  ],
};

const STOCK_RESTORING_CANCEL_FROM: ReadonlySet<OrderStatus> = new Set([
  "PENDING",
  "PROCESSING",
]);

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Processing",
  DELIVERED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Cancelled",
  REQUIRES_REVIEW: "Requires review",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Human label for admin orders table. */
export function orderStatusLabel(status: string): string {
  if (!isOrderStatus(status)) return status;
  return ORDER_STATUS_LABELS[status];
}

/** Returns statuses an admin may move the order to from `from`. */
export function getEligibleOrderStatuses(from: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[from]];
}

/** Whether `from → to` is a permitted fulfillment transition. */
export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Whether cancelling from this status should restore reserved stock. */
export function shouldRestoreStockOnCancel(from: OrderStatus): boolean {
  return STOCK_RESTORING_CANCEL_FROM.has(from);
}
