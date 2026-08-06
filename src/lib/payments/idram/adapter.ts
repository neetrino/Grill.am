import "server-only";

import { PaymentProviderNotConfiguredError } from "@/features/payments/domain/errors";
import { getIdramConfig } from "@/lib/payments/idram/config";
import type { PaymentAdapter, PaymentResult } from "@/lib/payments/types";

/**
 * Real iDram adapter — never falls back to COD or ARCA.
 * Checkout initializes the official POST form via createIdramPaymentForm.
 */
export function createIdramPaymentAdapter(): PaymentAdapter {
  return {
    name: "idram",
    async createPayment(): Promise<PaymentResult> {
      if (!getIdramConfig()) {
        throw new PaymentProviderNotConfiguredError("idram");
      }
      return {
        provider: "idram",
        status: "pending",
        providerReference: null,
        redirectUrl: null,
      };
    },
  };
}
