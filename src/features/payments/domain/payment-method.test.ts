import { describe, expect, it } from "vitest";

import {
  getPaymentFlowType,
  isOnlinePaymentProvider,
  isPaymentMethod,
  toPaymentRecord,
} from "@/features/payments/domain/payment-method";

describe("payment method domain", () => {
  it("maps COD to offline and ARCA/iDram to online", () => {
    expect(getPaymentFlowType("cash_on_delivery")).toBe("offline");
    expect(getPaymentFlowType("arca")).toBe("online");
    expect(getPaymentFlowType("idram")).toBe("online");
  });

  it("maps methods to provider/method records without COD fallback", () => {
    expect(toPaymentRecord("cash_on_delivery")).toEqual({
      provider: "cod",
      method: "COD",
    });
    expect(toPaymentRecord("arca")).toEqual({
      provider: "arca",
      method: "ARCA",
    });
    expect(toPaymentRecord("idram")).toEqual({
      provider: "idram",
      method: "IDRAM",
    });
  });

  it("identifies online providers", () => {
    expect(isOnlinePaymentProvider("cod")).toBe(false);
    expect(isOnlinePaymentProvider("arca")).toBe(true);
    expect(isOnlinePaymentProvider("idram")).toBe(true);
  });

  it("validates payment method strings", () => {
    expect(isPaymentMethod("cash_on_delivery")).toBe(true);
    expect(isPaymentMethod("paypal")).toBe(false);
  });
});
