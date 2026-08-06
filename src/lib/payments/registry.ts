import { createArcaPaymentAdapter } from "@/lib/payments/arca/adapter";
import { createCodPaymentAdapter } from "@/lib/payments/cod-adapter";
import { createIdramPaymentAdapter } from "@/lib/payments/idram/adapter";
import { createNotConfiguredPaymentAdapter } from "@/lib/payments/not-configured-adapter";
import type { PaymentAdapter } from "@/lib/payments/types";
import type { PaymentProvider } from "@/features/payments/domain/payment-method";
import { isPaymentProvider } from "@/features/payments/domain/payment-method";
import { PaymentProviderNotConfiguredError } from "@/features/payments/domain/errors";
import { getEnv } from "@/config/env";

/**
 * Resolves the payment adapter for a provider.
 * COD, ARCA, and iDram are real when enabled.
 * Never falls back across providers.
 */
export function getPaymentAdapter(provider: PaymentProvider): PaymentAdapter {
  switch (provider) {
    case "cod":
      return createCodPaymentAdapter();
    case "arca": {
      if (!getEnv().PAYMENT_ENABLE_ARCA) {
        return createNotConfiguredPaymentAdapter("arca");
      }
      return createArcaPaymentAdapter();
    }
    case "idram": {
      if (!getEnv().PAYMENT_ENABLE_IDRAM) {
        return createNotConfiguredPaymentAdapter("idram");
      }
      return createIdramPaymentAdapter();
    }
    default: {
      const _exhaustive: never = provider;
      throw new PaymentProviderNotConfiguredError(String(_exhaustive));
    }
  }
}

export function getPaymentAdapterOrThrow(provider: string): PaymentAdapter {
  if (!isPaymentProvider(provider)) {
    throw new PaymentProviderNotConfiguredError(provider);
  }
  return getPaymentAdapter(provider);
}
