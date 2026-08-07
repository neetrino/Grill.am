import "server-only";

import { getEnv } from "@/config/env";
import {
  assertPaymentMethodEnabledIn,
  getSelectablePaymentMethodsFrom,
  isPaymentMethodEnabledIn,
  resolvePaymentMethodAvailability,
  type PaymentMethodAvailability,
} from "@/features/payments/domain/payment-availability";
import type { PaymentMethod } from "@/features/payments/domain/payment-method";
import { applyE2ePaymentAvailabilityOverride } from "@/lib/e2e/payment-availability-override";

function resolveBaseAvailability(): PaymentMethodAvailability {
  const env = getEnv();
  const base = resolvePaymentMethodAvailability({
    PAYMENT_ENABLE_COD: env.PAYMENT_ENABLE_COD,
    PAYMENT_ENABLE_ARCA: env.PAYMENT_ENABLE_ARCA,
    PAYMENT_ENABLE_IDRAM: env.PAYMENT_ENABLE_IDRAM,
  });
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.E2E_PROVIDER_MODE?.trim().toLowerCase() === "mock"
  ) {
    return applyE2ePaymentAvailabilityOverride(base);
  }
  return base;
}

/**
 * Server-authoritative payment method flags from validated env (+ E2E override).
 */
export function getPaymentMethodAvailability(): PaymentMethodAvailability {
  return resolveBaseAvailability();
}

export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  return isPaymentMethodEnabledIn(getPaymentMethodAvailability(), method);
}

export function assertPaymentMethodEnabled(method: PaymentMethod): void {
  assertPaymentMethodEnabledIn(getPaymentMethodAvailability(), method);
}

export function getSelectablePaymentMethods(): PaymentMethod[] {
  return getSelectablePaymentMethodsFrom(getPaymentMethodAvailability());
}
