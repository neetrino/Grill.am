import { describe, expect, it } from "vitest";

import {
  ARCA_STATUS_MAP,
  isDocumentedArcaOrderStatus,
  mapArcaOrderStatus,
} from "@/lib/payments/arca/status-map";
import { ARCA_ORDER_STATUSES } from "@/lib/payments/arca/types";

describe("ARCA status mapping (Merchant Manual §7.1.5)", () => {
  it("documents every official orderStatus code", () => {
    expect(ARCA_STATUS_MAP.map((row) => row.officialCode)).toEqual([
      ...ARCA_ORDER_STATUSES,
    ]);
    for (const code of ARCA_ORDER_STATUSES) {
      expect(isDocumentedArcaOrderStatus(code)).toBe(true);
    }
  });

  it("maps deposited (2) to captured", () => {
    expect(mapArcaOrderStatus(2, "one_stage").localState).toBe("captured");
    expect(mapArcaOrderStatus(2, "two_stage").localState).toBe("captured");
  });

  it("maps held (1) to authorized only in two-stage mode", () => {
    expect(mapArcaOrderStatus(1, "two_stage").localState).toBe("authorized");
    expect(mapArcaOrderStatus(1, "one_stage").localState).toBe(
      "reconciliation_required",
    );
  });

  it("maps pending-like and declined states safely", () => {
    expect(mapArcaOrderStatus(0, "one_stage").localState).toBe("pending");
    expect(mapArcaOrderStatus(5, "one_stage").localState).toBe("pending");
    expect(mapArcaOrderStatus(6, "one_stage").localState).toBe("failed");
    expect(mapArcaOrderStatus(3, "one_stage").localState).toBe("reversed");
    expect(mapArcaOrderStatus(4, "one_stage").localState).toBe("refunded");
  });

  it("never treats unknown/missing status as captured or failed", () => {
    expect(mapArcaOrderStatus(null, "one_stage").localState).toBe("unknown");
  });
});
