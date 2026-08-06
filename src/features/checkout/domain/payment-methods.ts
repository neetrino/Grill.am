/**
 * Checkout UI payment methods — re-exports canonical payment domain types
 * so checkout schemas/components stay stable.
 */
export {
  PAYMENT_METHODS as CHECKOUT_PAYMENT_METHODS,
  type PaymentMethod as CheckoutPaymentMethod,
  isPaymentMethod as isCheckoutPaymentMethod,
  toPaymentRecord,
  getPaymentFlowType,
} from "@/features/payments/domain/payment-method";
