import "server-only";

import { initializeArcaPayment } from "@/features/payments/providers/arca/initialize-arca-payment";
import { PaymentProviderNotConfiguredError } from "@/features/payments/domain/errors";
import { getArcaConfig } from "@/lib/payments/arca/config";
import type { PaymentAdapter, PaymentIntent, PaymentResult } from "@/lib/payments/types";

/**
 * Real ARCA adapter — never falls back to COD.
 * createPayment initializes (or reuses) registration and returns pending + reference.
 */
export function createArcaPaymentAdapter(): PaymentAdapter {
  return {
    name: "arca",
    async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
      if (!getArcaConfig()) {
        throw new PaymentProviderNotConfiguredError("arca");
      }

      // intent.orderId is the local payment attempt id when called from checkout init.
      const result = await initializeArcaPayment({
        paymentId: intent.idempotencyKey,
      });

      if (result.type === "uncertain") {
        return {
          provider: "arca",
          status: "pending",
          providerReference: null,
          redirectUrl: null,
        };
      }

      return {
        provider: "arca",
        status: "pending",
        providerReference: result.providerReference,
        redirectUrl: result.redirectUrl,
      };
    },
  };
}
