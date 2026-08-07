import { describe, expect, it } from "vitest";

import { PaymentMethodDisabledError } from "@/features/payments/domain/errors";
import {
  applyOnlinePaymentsAdminOnlyGate,
  assertPaymentMethodEnabledIn,
  resolvePaymentMethodAvailability,
} from "@/features/payments/domain/payment-availability";

describe("payment method availability", () => {
  it("maps env flags to availability", () => {
    expect(
      resolvePaymentMethodAvailability({
        PAYMENT_ENABLE_COD: true,
        PAYMENT_ENABLE_ARCA: false,
        PAYMENT_ENABLE_IDRAM: false,
      }),
    ).toEqual({
      cash_on_delivery: true,
      arca: false,
      idram: false,
    });
  });

  it("rejects disabled ARCA server-side", () => {
    const availability = resolvePaymentMethodAvailability({
      PAYMENT_ENABLE_COD: true,
      PAYMENT_ENABLE_ARCA: false,
      PAYMENT_ENABLE_IDRAM: false,
    });
    expect(() => assertPaymentMethodEnabledIn(availability, "arca")).toThrow(
      PaymentMethodDisabledError,
    );
  });

  it("rejects disabled iDram server-side", () => {
    const availability = resolvePaymentMethodAvailability({
      PAYMENT_ENABLE_COD: true,
      PAYMENT_ENABLE_ARCA: false,
      PAYMENT_ENABLE_IDRAM: false,
    });
    expect(() => assertPaymentMethodEnabledIn(availability, "idram")).toThrow(
      PaymentMethodDisabledError,
    );
  });

  it("allows COD when enabled", () => {
    const availability = resolvePaymentMethodAvailability({
      PAYMENT_ENABLE_COD: true,
      PAYMENT_ENABLE_ARCA: false,
      PAYMENT_ENABLE_IDRAM: false,
    });
    expect(() =>
      assertPaymentMethodEnabledIn(availability, "cash_on_delivery"),
    ).not.toThrow();
  });

  it("keeps online methods for ADMIN under admin-only gate", () => {
    const availability = resolvePaymentMethodAvailability({
      PAYMENT_ENABLE_COD: true,
      PAYMENT_ENABLE_ARCA: true,
      PAYMENT_ENABLE_IDRAM: true,
    });
    expect(applyOnlinePaymentsAdminOnlyGate(availability, "ADMIN")).toEqual({
      cash_on_delivery: true,
      arca: true,
      idram: true,
    });
  });

  it("disables online methods for guests, customers, and operators", () => {
    const availability = resolvePaymentMethodAvailability({
      PAYMENT_ENABLE_COD: true,
      PAYMENT_ENABLE_ARCA: true,
      PAYMENT_ENABLE_IDRAM: true,
    });
    for (const role of [null, undefined, "CUSTOMER", "OPERATOR"] as const) {
      expect(applyOnlinePaymentsAdminOnlyGate(availability, role)).toEqual({
        cash_on_delivery: true,
        arca: false,
        idram: false,
      });
    }
  });
});
