import "server-only";

import { getEnv } from "@/config/env";
import {
  applyArcaViewerGate,
  assertPaymentMethodEnabledIn,
  getSelectablePaymentMethodsFrom,
  isPaymentMethodEnabledIn,
  resolvePaymentMethodAvailability,
  type PaymentMethodAvailability,
} from "@/features/payments/domain/payment-availability";
import type { PaymentMethod } from "@/features/payments/domain/payment-method";
import { applyE2ePaymentAvailabilityOverride } from "@/lib/e2e/payment-availability-override";
import { getArcaConfig } from "@/lib/payments/arca/config";

export type PaymentAvailabilityViewer = {
  isAdmin?: boolean;
};

function isE2eMockMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.E2E_PROVIDER_MODE?.trim().toLowerCase() === "mock"
  );
}

function withArcaCredentialsGate(
  availability: PaymentMethodAvailability,
): PaymentMethodAvailability {
  if (!availability.arca) {
    return availability;
  }
  // Hosted 3-D Secure form requires a complete ARCA runtime config.
  // Admin may bypass PAYMENT_ENABLE_ARCA, but never missing credentials.
  if (getArcaConfig() === null) {
    return { ...availability, arca: false };
  }
  return availability;
}

function resolveBaseAvailability(): PaymentMethodAvailability {
  const env = getEnv();
  const base = resolvePaymentMethodAvailability({
    PAYMENT_ENABLE_COD: env.PAYMENT_ENABLE_COD,
    PAYMENT_ENABLE_ARCA: env.PAYMENT_ENABLE_ARCA,
    PAYMENT_ENABLE_IDRAM: env.PAYMENT_ENABLE_IDRAM,
  });
  if (isE2eMockMode()) {
    return applyE2ePaymentAvailabilityOverride(base);
  }
  return base;
}

function resolveViewerAvailability(
  viewer?: PaymentAvailabilityViewer,
): PaymentMethodAvailability {
  const base = resolveBaseAvailability();
  if (isE2eMockMode()) {
    return withArcaCredentialsGate(base);
  }
  return withArcaCredentialsGate(
    applyArcaViewerGate(base, viewer?.isAdmin === true),
  );
}

/**
 * Server-authoritative payment method flags from validated env (+ E2E override).
 * Customers follow `PAYMENT_ENABLE_*`; admin may use ARCA when its flag is off
 * only if ARCA runtime credentials are present.
 */
export function getPaymentMethodAvailability(
  viewer?: PaymentAvailabilityViewer,
): PaymentMethodAvailability {
  return resolveViewerAvailability(viewer);
}

export function isPaymentMethodEnabled(
  method: PaymentMethod,
  viewer?: PaymentAvailabilityViewer,
): boolean {
  return isPaymentMethodEnabledIn(
    getPaymentMethodAvailability(viewer),
    method,
  );
}

export function assertPaymentMethodEnabled(
  method: PaymentMethod,
  viewer?: PaymentAvailabilityViewer,
): void {
  assertPaymentMethodEnabledIn(getPaymentMethodAvailability(viewer), method);
}

export function getSelectablePaymentMethods(
  viewer?: PaymentAvailabilityViewer,
): PaymentMethod[] {
  return getSelectablePaymentMethodsFrom(getPaymentMethodAvailability(viewer));
}
