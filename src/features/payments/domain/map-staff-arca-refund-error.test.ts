import { describe, expect, it } from "vitest";

import {
  PaymentAmountMismatchError,
  PaymentRefundInProgressError,
  PaymentRefundNotAllowedError,
  PaymentRefundUnconfirmedError,
} from "@/features/payments/domain/errors";
import { mapStaffArcaRefundError } from "@/features/payments/domain/map-staff-arca-refund-error";
import { ArcaBusinessError, ArcaTimeoutError } from "@/lib/payments/arca/errors";

describe("mapStaffArcaRefundError", () => {
  it("maps bank access denied separately from a generic failure", () => {
    const mapped = mapStaffArcaRefundError(
      new ArcaBusinessError("5", "ARCA reverse was rejected."),
    );
    expect(mapped.code).toBe("ARCA_ACCESS_DENIED");
    expect(mapped.message).toMatch(/enable reverse and refund/i);
  });

  it("maps official error 7 as an invalid bank state", () => {
    expect(mapStaffArcaRefundError(new ArcaBusinessError("7")).code).toBe(
      "ARCA_REFUND_INVALID_STATE",
    );
  });

  it("maps domain refund failures to stable codes", () => {
    expect(mapStaffArcaRefundError(new PaymentRefundInProgressError()).code).toBe(
      "PAYMENT_REFUND_IN_PROGRESS",
    );
    expect(mapStaffArcaRefundError(new PaymentRefundUnconfirmedError()).code).toBe(
      "PAYMENT_REFUND_UNCONFIRMED",
    );
    expect(mapStaffArcaRefundError(new PaymentRefundNotAllowedError()).code).toBe(
      "PAYMENT_REFUND_NOT_ALLOWED",
    );
    expect(mapStaffArcaRefundError(new PaymentAmountMismatchError()).code).toBe(
      "PAYMENT_AMOUNT_MISMATCH",
    );
  });

  it("does not leak protocol internals for timeouts", () => {
    const mapped = mapStaffArcaRefundError(new ArcaTimeoutError());
    expect(mapped.code).toBe("PAYMENT_REFUND_FAILED");
    expect(mapped.message).toBe("Unable to refund this payment right now.");
  });
});
