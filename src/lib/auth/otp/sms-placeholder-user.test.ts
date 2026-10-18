import { describe, expect, it } from "vitest";

import {
  isSmsPlaceholderEmail,
  smsPlaceholderEmail,
} from "@/lib/auth/otp/sms-placeholder-user";

describe("sms placeholder user email", () => {
  it("builds a stable address from E.164 digits", () => {
    expect(smsPlaceholderEmail("+37499123456")).toBe(
      "sms.37499123456@phone.local",
    );
  });

  it("detects only the synthetic SMS signup pattern", () => {
    expect(isSmsPlaceholderEmail("sms.37499123456@phone.local")).toBe(true);
    expect(isSmsPlaceholderEmail("admin@grill.am")).toBe(false);
    expect(isSmsPlaceholderEmail("sms.not-digits@phone.local")).toBe(false);
  });
});
