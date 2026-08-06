/**
 * Canonical checkout payment methods (UI + server action contract).
 * Keep these values stable across UI, Zod schemas, and checkout.
 */
export const PAYMENT_METHODS = [
  "cash_on_delivery",
  "arca",
  "idram",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Stored on `payments.provider`. */
export const PAYMENT_PROVIDERS = ["cod", "arca", "idram"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type PaymentFlowType = "offline" | "online";

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isPaymentProvider(value: string): value is PaymentProvider {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Maps a checkout payment method to offline (COD) vs online (provider redirect).
 * Exhaustive: adding a method without a branch is a TypeScript error.
 */
export function getPaymentFlowType(method: PaymentMethod): PaymentFlowType {
  switch (method) {
    case "cash_on_delivery":
      return "offline";
    case "arca":
    case "idram":
      return "online";
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unsupported payment method: ${String(_exhaustive)}`);
    }
  }
}

/** Maps checkout method → payments.provider / payments.method columns. */
export function toPaymentRecord(method: PaymentMethod): {
  provider: PaymentProvider;
  method: string;
} {
  switch (method) {
    case "cash_on_delivery":
      return { provider: "cod", method: "COD" };
    case "arca":
      return { provider: "arca", method: "ARCA" };
    case "idram":
      return { provider: "idram", method: "IDRAM" };
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unsupported payment method: ${String(_exhaustive)}`);
    }
  }
}

/** Online providers that require a redirect/callback integration. */
export function isOnlinePaymentProvider(
  provider: PaymentProvider,
): provider is "arca" | "idram" {
  return provider === "arca" || provider === "idram";
}
