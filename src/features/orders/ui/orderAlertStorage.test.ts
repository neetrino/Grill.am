import { describe, expect, it } from "vitest";

import {
  acknowledgeOrderId,
  acknowledgeOrderIds,
  isOrderAcknowledged,
} from "@/features/orders/ui/orderAlertStorage";

const baseState = {
  baselineAt: "2026-08-08T00:00:00.000Z",
  ackedIds: [] as string[],
};

describe("orderAlertStorage", () => {
  it("acknowledges many order ids at once", () => {
    const next = acknowledgeOrderIds(baseState, ["a", "b", "c"]);

    expect(isOrderAcknowledged(next, "a")).toBe(true);
    expect(isOrderAcknowledged(next, "b")).toBe(true);
    expect(isOrderAcknowledged(next, "c")).toBe(true);
    expect(next.ackedIds).toEqual(["a", "b", "c"]);
  });

  it("skips already acknowledged ids", () => {
    const withOne = acknowledgeOrderId(baseState, "a");
    const next = acknowledgeOrderIds(withOne, ["a", "b"]);

    expect(next.ackedIds).toEqual(["a", "b"]);
  });
});
