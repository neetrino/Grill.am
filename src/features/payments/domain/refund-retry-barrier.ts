/** Whether a customer retry must be refused after a completed refund. */
export function isPaymentRetryBlockedByRefund(
  orderPaymentStatus: string,
  latestAttemptStatus: string | null,
): boolean {
  return (
    orderPaymentStatus === "REFUNDED" || latestAttemptStatus === "REFUNDED"
  );
}
