import { afterEach, describe, expect, it, vi } from "vitest";

import { resetEnvCacheForTests } from "@/config/env";

describe("payment adapter registry", () => {
  afterEach(() => {
    resetEnvCacheForTests();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns COD adapter for cod", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("PAYMENT_ENABLE_ARCA", "false");
    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    expect(getPaymentAdapter("cod").name).toBe("cod");
  });

  it("never resolves ARCA to COD when disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("PAYMENT_ENABLE_ARCA", "false");
    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    const { PaymentProviderNotConfiguredError } = await import(
      "@/features/payments/domain/errors"
    );
    const adapter = getPaymentAdapter("arca");
    expect(adapter.name).toBe("arca");
    await expect(
      adapter.createPayment({
        orderId: "o1",
        amount: 1000n,
        currency: "AMD",
        idempotencyKey: "k1",
      }),
    ).rejects.toBeInstanceOf(PaymentProviderNotConfiguredError);
  });

  it("never resolves iDram to COD", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    const { PaymentProviderNotConfiguredError } = await import(
      "@/features/payments/domain/errors"
    );
    const adapter = getPaymentAdapter("idram");
    expect(adapter.name).toBe("idram");
    await expect(
      adapter.createPayment({
        orderId: "o1",
        amount: 1000n,
        currency: "AMD",
        idempotencyKey: "k1",
      }),
    ).rejects.toBeInstanceOf(PaymentProviderNotConfiguredError);
  });
});
