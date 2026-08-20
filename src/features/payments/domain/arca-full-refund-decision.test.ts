import { describe, expect, it } from "vitest";

import {
  decideArcaFullRefund,
  isArcaReverseUnavailable,
} from "@/features/payments/domain/arca-full-refund-decision";

describe("decideArcaFullRefund", () => {
  it("marks local refund when the bank already returned funds", () => {
    expect(decideArcaFullRefund("refunded")).toEqual({ action: "mark_refunded" });
    expect(decideArcaFullRefund("reversed")).toEqual({ action: "mark_refunded" });
  });

  it("reverses a deposited one-stage payment", () => {
    expect(decideArcaFullRefund("captured")).toEqual({
      action: "reverse_then_refund",
    });
  });

  it("rejects unpaid or unknown states", () => {
    expect(decideArcaFullRefund("pending")).toEqual({ action: "reject" });
    expect(decideArcaFullRefund("authorized")).toEqual({ action: "reject" });
    expect(decideArcaFullRefund("failed")).toEqual({ action: "reject" });
  });

  it("treats official error 7 as reverse-unavailable", () => {
    expect(isArcaReverseUnavailable("7")).toBe(true);
    expect(isArcaReverseUnavailable("5")).toBe(false);
  });
});
