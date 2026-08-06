/**
 * Provider-independent payment UI states for storefront and admin presentation.
 * Derived from DB truth — never from browser success/fail query flags alone.
 */
export const PAYMENT_PRESENTATION_STATES = [
  "cod_pending",
  "redirect_required",
  "awaiting_provider",
  "processing",
  "authorized",
  "captured",
  "failed",
  "cancelled",
  "refunded",
  "requires_review",
  "expired",
  "unavailable",
] as const;

export type PaymentPresentationState =
  (typeof PAYMENT_PRESENTATION_STATES)[number];

export type PaymentPresentationInput = {
  paymentMethod: string;
  provider: string | null;
  orderStatus: string;
  orderPaymentStatus: string;
  latestAttemptStatus: string | null;
  capturedExists: boolean;
  /** True when provider init succeeded and customer must leave the site. */
  providerInitialized: boolean;
  /** True when attempt has expired locally and is still PENDING. */
  attemptExpired: boolean;
  /** True when provider config/feature flag blocks further payment. */
  providerUnavailable: boolean;
};

export type PaymentPresentationResult = {
  state: PaymentPresentationState;
  /** Customer may retry online payment (new attempt). */
  retryEligible: boolean;
  /** Customer may recheck local/provider status without new attempt. */
  recheckEligible: boolean;
  /** Show COD-on-delivery instructions. */
  isCod: boolean;
};
