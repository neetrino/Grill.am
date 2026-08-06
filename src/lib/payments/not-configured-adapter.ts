import type { PaymentAdapter } from "@/lib/payments/types";
import { PaymentProviderNotConfiguredError } from "@/features/payments/domain/errors";

/**
 * Placeholder adapter for providers that are not wired yet (ARCA / iDram).
 * Never silently falls back to COD.
 */
export function createNotConfiguredPaymentAdapter(
  providerName: "arca" | "idram",
): PaymentAdapter {
  return {
    name: providerName,
    async createPayment() {
      throw new PaymentProviderNotConfiguredError(providerName);
    },
  };
}
