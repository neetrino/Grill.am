/**
 * How an order's amount affects analytics revenue.
 * Every fulfillment status adds, including pending.
 * Cancelled and refunded orders contribute nothing, so cancelling
 * removes the previously counted amount once.
 */

/** Fulfillment statuses excluded from revenue. */
export const REVENUE_EXCLUDED_ORDER_STATUSES = ["CANCELLED", "REFUNDED"] as const;

export function orderRevenueContribution(input: {
  orderStatus: string;
  amount: number;
}): number {
  const excluded = REVENUE_EXCLUDED_ORDER_STATUSES.some(
    (status) => status === input.orderStatus,
  );
  return excluded ? 0 : input.amount;
}
