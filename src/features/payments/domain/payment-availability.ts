import { PaymentMethodDisabledError } from "@/features/payments/domain/errors";
import {
  type PaymentMethod,
  getPaymentFlowType,
} from "@/features/payments/domain/payment-method";

export type PaymentMethodAvailability = {
  cash_on_delivery: boolean;
  arca: boolean;
  idram: boolean;
};

export type PaymentAvailabilityFlags = {
  PAYMENT_ENABLE_COD: boolean;
  PAYMENT_ENABLE_ARCA: boolean;
  PAYMENT_ENABLE_IDRAM: boolean;
};

/** Pure mapping from validated env flags → checkout availability. */
export function resolvePaymentMethodAvailability(
  flags: PaymentAvailabilityFlags,
): PaymentMethodAvailability {
  return {
    cash_on_delivery: flags.PAYMENT_ENABLE_COD,
    arca: flags.PAYMENT_ENABLE_ARCA,
    idram: flags.PAYMENT_ENABLE_IDRAM,
  };
}

export function isPaymentMethodEnabledIn(
  availability: PaymentMethodAvailability,
  method: PaymentMethod,
): boolean {
  return availability[method];
}

/**
 * Rejects disabled methods at the server boundary.
 * Throws {@link PaymentMethodDisabledError} when the method is off.
 */
export function assertPaymentMethodEnabledIn(
  availability: PaymentMethodAvailability,
  method: PaymentMethod,
): void {
  if (!isPaymentMethodEnabledIn(availability, method)) {
    throw new PaymentMethodDisabledError(method);
  }
}

/** Methods safe to show as selectable in checkout UI. */
export function getSelectablePaymentMethodsFrom(
  availability: PaymentMethodAvailability,
): PaymentMethod[] {
  return (Object.keys(availability) as PaymentMethod[]).filter(
    (method) => availability[method],
  );
}

/** Whether the method requires a future provider redirect (not COD). */
export function requiresOnlineProvider(method: PaymentMethod): boolean {
  return getPaymentFlowType(method) === "online";
}
