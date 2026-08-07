import "server-only";

import { getEnv } from "@/config/env";
import {
  applyOnlinePaymentsAdminOnlyGate,
  assertPaymentMethodEnabledIn,
  getSelectablePaymentMethodsFrom,
  isPaymentMethodEnabledIn,
  resolvePaymentMethodAvailability,
  type PaymentActorRole,
  type PaymentMethodAvailability,
} from "@/features/payments/domain/payment-availability";
import type { PaymentMethod } from "@/features/payments/domain/payment-method";
import { applyE2ePaymentAvailabilityOverride } from "@/lib/e2e/payment-availability-override";

export type PaymentAvailabilityOptions = {
  /** Session role; guests pass null/undefined. */
  actorRole?: PaymentActorRole;
};

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
 * When PAYMENT_ONLINE_ADMIN_ONLY is on, ARCA/iDram require actorRole === "ADMIN".
 */
export function getPaymentMethodAvailability(
  options?: PaymentAvailabilityOptions,
): PaymentMethodAvailability {
  const availability = resolveBaseAvailability();
  if (!getEnv().PAYMENT_ONLINE_ADMIN_ONLY) {
    return availability;
  }
  return applyOnlinePaymentsAdminOnlyGate(availability, options?.actorRole);
}

export function isPaymentMethodEnabled(
  method: PaymentMethod,
  options?: PaymentAvailabilityOptions,
): boolean {
  return isPaymentMethodEnabledIn(
    getPaymentMethodAvailability(options),
    method,
  );
}

export function assertPaymentMethodEnabled(
  method: PaymentMethod,
  options?: PaymentAvailabilityOptions,
): void {
  assertPaymentMethodEnabledIn(
    getPaymentMethodAvailability(options),
    method,
  );
}

export function getSelectablePaymentMethods(
  options?: PaymentAvailabilityOptions,
): PaymentMethod[] {
  return getSelectablePaymentMethodsFrom(
    getPaymentMethodAvailability(options),
  );
}
