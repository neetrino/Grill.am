import "server-only";

import type { PaymentMethodAvailability } from "@/features/payments/domain/payment-availability";

const GLOBAL_KEY = "__grill_am_e2e_payment_availability_override__";

type OverrideGlobal = {
  value: Partial<PaymentMethodAvailability> | null;
};

function slot(): OverrideGlobal {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: OverrideGlobal;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { value: null };
  }
  return g[GLOBAL_KEY];
}

/** E2E-only in-memory availability override. Forbidden in production. */
export function setE2ePaymentAvailabilityOverride(
  next: Partial<PaymentMethodAvailability> | null,
): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("E2E payment availability override is forbidden in production.");
  }
  slot().value = next;
}

export function getE2ePaymentAvailabilityOverride(): Partial<PaymentMethodAvailability> | null {
  return slot().value;
}

export function applyE2ePaymentAvailabilityOverride(
  base: PaymentMethodAvailability,
): PaymentMethodAvailability {
  const override = slot().value;
  if (!override) {
    return base;
  }
  return {
    cash_on_delivery:
      override.cash_on_delivery ?? base.cash_on_delivery,
    arca: override.arca ?? base.arca,
    idram: override.idram ?? base.idram,
  };
}
