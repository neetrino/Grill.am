import { afterEach, describe, expect, it, vi } from "vitest";

import { resetEnvCacheForTests } from "@/config/env";

function stubArcaEnv(): void {
  vi.stubEnv("PAYMENT_ENABLE_ARCA", "true");
  vi.stubEnv("ARCA_ENVIRONMENT", "production");
  vi.stubEnv("ARCA_PAYMENT_MODE", "one_stage");
  vi.stubEnv("ARCA_API_BASE_URL", "https://ipay.arca.am/payment/rest");
  vi.stubEnv("ARCA_API_USERNAME", "api-user");
  vi.stubEnv("ARCA_API_PASSWORD", "api-pass");
  vi.stubEnv("ARCA_RETURN_BASE_URL", "https://grill.am");
  vi.stubEnv("ARCA_CURRENCY_CODE", "051");
  vi.stubEnv("ARCA_LANGUAGE", "en");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://grill.am");
  vi.stubEnv("NODE_ENV", "test");
}

describe("ARCA HTTP client Accept / transport", () => {
  afterEach(() => {
    resetEnvCacheForTests();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("sends Accept */* (not application/json) and parses text/plain JSON success", async () => {
    stubArcaEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          errorCode: 0,
          orderId: "32faa424-858a-4f22-92c5-a50a9cfe56dc",
          formUrl:
            "https://ipay.arca.am/payment/merchants/x/payment_en.html?mdOrder=32faa424-858a-4f22-92c5-a50a9cfe56dc",
        }),
        {
          status: 200,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { createArcaPaymentClient, ARCA_REQUEST_ACCEPT } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");

    expect(ARCA_REQUEST_ACCEPT).toBe("*/*");
    expect(ARCA_REQUEST_ACCEPT).not.toBe("application/json");

    const client = createArcaPaymentClient(requireArcaConfig());
    const result = await client.register({
      orderNumber: "a1-testorder",
      amountMinorUnits: 1000n,
      currencyCode: "051",
      returnUrl: "https://grill.am/api/v1/payments/arca/return",
      language: "en",
      description: "diag",
      pageView: "DESKTOP",
    });

    expect(result.formUrl).toContain("ipay.arca.am");
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Accept")).toBe("*/*");
    expect(headers.get("Accept")).not.toBe("application/json");
    expect(headers.get("Content-Type")).toContain(
      "application/x-www-form-urlencoded",
    );
  });

  it("exposes HTTP status safely on non-2xx responses", async () => {
    stubArcaEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Error 406--Not Acceptable</html>", {
          status: 406,
          statusText: "Not Acceptable",
          headers: { "Content-Type": "text/html; charset=UTF-8" },
        }),
      ),
    );

    const { createArcaPaymentClient } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");
    const { ArcaHttpError } = await import("@/lib/payments/arca/errors");
    const client = createArcaPaymentClient(requireArcaConfig());

    try {
      await client.register({
        orderNumber: "a1-testorder",
        amountMinorUnits: 1000n,
        currencyCode: "051",
        returnUrl: "https://grill.am/api/v1/payments/arca/return",
      });
      expect.unreachable("expected ArcaHttpError");
    } catch (error) {
      expect(error).toBeInstanceOf(ArcaHttpError);
      const httpError = error as InstanceType<typeof ArcaHttpError>;
      expect(httpError.code).toBe("ARCA_HTTP");
      expect(httpError.httpStatus).toBe(406);
      expect(httpError.httpStatusText).toBe("Not Acceptable");
      expect(httpError.responseContentType).toContain("text/html");
      expect(httpError.endpointPath).toBe("/register.do");
      expect(httpError.message).not.toMatch(/password|api-pass|api-user/i);
    }
  });

  it("parses valid JSON when Content-Type is text/plain", async () => {
    stubArcaEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errorCode: 5,
            errorMessage: "Access denied",
            errorCodeString: "5",
            error: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
          },
        ),
      ),
    );

    const { createArcaPaymentClient } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");
    const { ArcaBusinessError } = await import("@/lib/payments/arca/errors");
    const client = createArcaPaymentClient(requireArcaConfig());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await client.register({
        orderNumber: "a1-testorder",
        amountMinorUnits: 1000n,
        currencyCode: "051",
        returnUrl: "https://grill.am/api/v1/payments/arca/return",
      });
      expect.unreachable("expected ArcaBusinessError");
    } catch (error) {
      expect(error).toBeInstanceOf(ArcaBusinessError);
      const business = error as InstanceType<typeof ArcaBusinessError>;
      expect(business.providerErrorCode).toBe("5");
      expect(business.providerErrorMessage).toBe("Access denied");
      expect(business.message).not.toMatch(/password|api-pass|api-user/i);
    }

    const logged = warnSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain("ARCA register response");
    expect(logged).toContain("\"errorCode\":\"5\"");
    expect(logged).toContain("Access denied");
    expect(logged).not.toMatch(/api-pass|api-user/i);
    warnSpy.mockRestore();
  });

  it("redacts credential-like ARCA errorMessage before log and throw", async () => {
    stubArcaEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errorCode: 5,
            errorMessage: "password=should-not-leak",
          }),
          {
            status: 200,
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
          },
        ),
      ),
    );

    const { createArcaPaymentClient } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");
    const { ArcaBusinessError } = await import("@/lib/payments/arca/errors");
    const client = createArcaPaymentClient(requireArcaConfig());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await client.register({
        orderNumber: "a1-testorder",
        amountMinorUnits: 1000n,
        currencyCode: "051",
        returnUrl: "https://grill.am/api/v1/payments/arca/return",
      });
      expect.unreachable("expected ArcaBusinessError");
    } catch (error) {
      expect(error).toBeInstanceOf(ArcaBusinessError);
      const business = error as InstanceType<typeof ArcaBusinessError>;
      expect(business.providerErrorMessage).toBe("[redacted provider message]");
    }

    const logged = warnSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain("ARCA register response");
    expect(logged).not.toContain("should-not-leak");
    warnSpy.mockRestore();
  });

  it("posts reverse.do without amount", async () => {
    stubArcaEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 0 }), {
        status: 200,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { createArcaPaymentClient } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");
    const client = createArcaPaymentClient(requireArcaConfig());
    await client.reverse({ orderId: "e5b59d3d-746b-4828-9da4-06f126e01b68" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/reverse.do");
    const body = String(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body,
    );
    expect(body).toContain("orderId=");
    expect(body).not.toContain("amount=");
  });

  it("posts refund.do with full minor-unit amount", async () => {
    stubArcaEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 0 }), {
        status: 200,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { createArcaPaymentClient } = await import(
      "@/lib/payments/arca/client"
    );
    const { requireArcaConfig } = await import("@/lib/payments/arca/config");
    const client = createArcaPaymentClient(requireArcaConfig());
    await client.refund({
      orderId: "5e97e3fd-1d20-4b4b-a542-f5995f5e8208",
      amountMinorUnits: 250000n,
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/refund.do");
    const body = String(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body,
    );
    expect(body).toContain("amount=250000");
    expect(body).toContain("currency=051");
  });
});
