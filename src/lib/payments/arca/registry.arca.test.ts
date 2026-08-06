import { afterEach, describe, expect, it, vi } from "vitest";

import { resetEnvCacheForTests } from "@/config/env";

describe("ARCA registry configuration", () => {
  afterEach(() => {
    resetEnvCacheForTests();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("keeps ARCA as not-configured when disabled and never returns COD", async () => {
    vi.stubEnv("PAYMENT_ENABLE_ARCA", "false");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
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

  it("keeps iDram unavailable", async () => {
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

  it("still returns COD adapter for cod", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    expect(getPaymentAdapter("cod").name).toBe("cod");
  });
});
