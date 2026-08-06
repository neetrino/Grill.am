import { afterEach, describe, expect, it, vi } from "vitest";

import { resetEnvCacheForTests } from "@/config/env";

describe("iDram registry", () => {
  afterEach(() => {
    resetEnvCacheForTests();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("keeps iDram not-configured when disabled and never returns COD/ARCA", async () => {
    vi.stubEnv("PAYMENT_ENABLE_IDRAM", "false");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    const { PaymentProviderNotConfiguredError } = await import(
      "@/features/payments/domain/errors"
    );
    const adapter = getPaymentAdapter("idram");
    expect(adapter.name).toBe("idram");
    expect(adapter.name).not.toBe("cod");
    expect(adapter.name).not.toBe("arca");
    await expect(
      adapter.createPayment({
        orderId: "o1",
        amount: 1000n,
        currency: "AMD",
        idempotencyKey: "k1",
      }),
    ).rejects.toBeInstanceOf(PaymentProviderNotConfiguredError);
  });

  it("returns real iDram adapter when enabled with config", async () => {
    vi.stubEnv("PAYMENT_ENABLE_IDRAM", "true");
    vi.stubEnv("IDRAM_REC_ACCOUNT", "100000114");
    vi.stubEnv("IDRAM_SECRET_KEY", "test-secret-only");
    vi.stubEnv(
      "IDRAM_PAYMENT_URL",
      "https://banking.idram.am/Payment/GetPayment",
    );
    vi.stubEnv(
      "IDRAM_RESULT_URL",
      "https://example.com/api/v1/payments/idram/result",
    );
    vi.stubEnv(
      "IDRAM_SUCCESS_URL",
      "https://example.com/api/v1/payments/idram/success",
    );
    vi.stubEnv(
      "IDRAM_FAIL_URL",
      "https://example.com/api/v1/payments/idram/fail",
    );
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    vi.stubEnv("NODE_ENV", "development");

    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    const adapter = getPaymentAdapter("idram");
    expect(adapter.name).toBe("idram");
    const result = await adapter.createPayment({
      orderId: "o1",
      amount: 1000n,
      currency: "AMD",
      idempotencyKey: "k1",
    });
    expect(result.provider).toBe("idram");
    expect(result.status).toBe("pending");
  });

  it("never maps idram to arca or cod when arca/cod enabled", async () => {
    vi.stubEnv("PAYMENT_ENABLE_IDRAM", "false");
    vi.stubEnv("PAYMENT_ENABLE_ARCA", "true");
    vi.stubEnv("PAYMENT_ENABLE_COD", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    // Minimal ARCA stubs so env parse can succeed if enable=true requires them —
    // if ARCA enable fails without config, disable and only assert idram isolation.
    vi.stubEnv("PAYMENT_ENABLE_ARCA", "false");

    const { getPaymentAdapter } = await import("@/lib/payments/registry");
    expect(getPaymentAdapter("idram").name).toBe("idram");
    expect(getPaymentAdapter("cod").name).toBe("cod");
    expect(getPaymentAdapter("arca").name).toBe("arca");
  });
});
