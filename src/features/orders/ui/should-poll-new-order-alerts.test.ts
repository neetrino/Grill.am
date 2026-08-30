import { describe, expect, it } from "vitest";

import { shouldPollNewOrderAlerts } from "@/features/orders/ui/should-poll-new-order-alerts";

describe("shouldPollNewOrderAlerts", () => {
  it("polls only while the document is visible", () => {
    expect(shouldPollNewOrderAlerts("visible")).toBe(true);
    expect(shouldPollNewOrderAlerts("hidden")).toBe(false);
  });
});
