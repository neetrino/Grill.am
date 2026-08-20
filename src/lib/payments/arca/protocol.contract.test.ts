import { describe, expect, it } from "vitest";

import {
  arcaRegisterResponseSchema,
  arcaReturnQuerySchema,
  arcaStatusResponseSchema,
  isArcaSystemOk,
  parseOrderStatusCode,
} from "@/lib/payments/arca/schemas";
import { buildArcaLocalOrderNumber } from "@/features/payments/providers/arca/local-order-number";
import { redactSensitive } from "@/lib/payments/arca/redaction";
import {
  isFormUrlHostAllowed,
  ARCA_REGISTER_PATH,
  ARCA_STATUS_PATH,
  ARCA_REVERSE_PATH,
  ARCA_REFUND_PATH,
  resolveRegisterPath,
} from "@/lib/payments/arca/paths";

describe("ARCA protocol contract fields", () => {
  it("uses official register and status paths", () => {
    expect(ARCA_REGISTER_PATH).toBe("/register.do");
    expect(ARCA_STATUS_PATH).toBe("/getOrderStatusExtended.do");
    expect(ARCA_REVERSE_PATH).toBe("/reverse.do");
    expect(ARCA_REFUND_PATH).toBe("/refund.do");
    expect(resolveRegisterPath("one_stage")).toBe("/register.do");
    expect(resolveRegisterPath("two_stage")).toBe("/registerPreAuth.do");
  });

  it("parses registration success and error responses", () => {
    const ok = arcaRegisterResponseSchema.parse({
      orderId: "32faa424-858a-4f22-92c5-a50a9cfe56dc",
      formUrl:
        "https://ipay.arca.am/payment/merchants/x/payment_ru.html?mdOrder=32faa424-858a-4f22-92c5-a50a9cfe56dc",
      errorCode: 0,
    });
    expect(ok.orderId).toBeTruthy();
    expect(isArcaSystemOk(ok.errorCode)).toBe(true);

    const err = arcaRegisterResponseSchema.parse({
      errorCode: "1",
      errorMessage: "Already registered",
    });
    expect(isArcaSystemOk(err.errorCode)).toBe(false);
  });

  it("parses status responses and orderStatus codes", () => {
    const status = arcaStatusResponseSchema.parse({
      orderNumber: "a1-abc",
      orderStatus: 2,
      actionCode: 0,
      amount: 100000,
      currency: "051",
      errorCode: 0,
    });
    expect(parseOrderStatusCode(status.orderStatus)).toBe(2);
  });

  it("accepts only documented return correlation fields", () => {
    const parsed = arcaReturnQuerySchema.parse({
      pid: "550e8400-e29b-41d4-a716-446655440000",
      orderId: "32faa424-858a-4f22-92c5-a50a9cfe56dc",
    });
    expect(parsed.pid).toBeTruthy();
    expect(
      arcaReturnQuerySchema.safeParse({ orderId: "x" }).success,
    ).toBe(false);
  });

  it("builds AN..32 stable local order numbers", () => {
    const value = buildArcaLocalOrderNumber(
      "550e8400-e29b-41d4-a716-446655440000",
      2,
    );
    expect(value.length).toBeLessThanOrEqual(32);
    expect(value.startsWith("a2-")).toBe(true);
    expect(
      buildArcaLocalOrderNumber(
        "550e8400-e29b-41d4-a716-446655440000",
        2,
      ),
    ).toBe(value);
  });

  it("allowlists form URL hosts and redacts credentials", () => {
    expect(
      isFormUrlHostAllowed("https://ipay.arca.am/payment/x", [
        "ipay.arca.am",
      ]),
    ).toBe(true);
    expect(
      isFormUrlHostAllowed("https://evil.example/payment", ["ipay.arca.am"]),
    ).toBe(false);
    expect(
      redactSensitive({ userName: "api", password: "secret", orderId: "1" }),
    ).toEqual({
      userName: "[REDACTED]",
      password: "[REDACTED]",
      orderId: "1",
    });
  });
});
