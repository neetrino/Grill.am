import { describe, expect, it } from "vitest";

import {
  CUSTOMER_NOTE_MAX_LENGTH,
  sanitizeCustomerNote,
} from "@/features/checkout/domain/customer-note";

describe("sanitizeCustomerNote", () => {
  it("returns null for empty input", () => {
    expect(sanitizeCustomerNote(undefined)).toBeNull();
    expect(sanitizeCustomerNote(null)).toBeNull();
    expect(sanitizeCustomerNote("")).toBeNull();
    expect(sanitizeCustomerNote("   ")).toBeNull();
  });

  it("strips HTML and collapses horizontal whitespace", () => {
    expect(sanitizeCustomerNote('<script>alert(1)</script>Leave at door')).toBe(
      "alert(1) Leave at door",
    );
    expect(sanitizeCustomerNote("  call   before   delivery  ")).toBe(
      "call before delivery",
    );
  });

  it("preserves intentional newlines", () => {
    expect(sanitizeCustomerNote("Floor 3\nCode 1234")).toBe("Floor 3\nCode 1234");
  });

  it("truncates to max length", () => {
    const long = "a".repeat(CUSTOMER_NOTE_MAX_LENGTH + 50);
    expect(sanitizeCustomerNote(long)?.length).toBe(CUSTOMER_NOTE_MAX_LENGTH);
  });
});
