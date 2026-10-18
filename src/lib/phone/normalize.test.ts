import { describe, expect, it } from "vitest";

import {
  normalizePhoneToE164,
  phoneLookupCandidates,
  phoneMatchDigits,
} from "@/lib/phone/normalize";
import { toMobipaceRecipient } from "@/lib/sms/recipient";

describe("normalizePhoneToE164", () => {
  it("canonicalizes Armenian local, international, and 00 prefixes", () => {
    expect(normalizePhoneToE164("099123456")).toBe("+37499123456");
    expect(normalizePhoneToE164("+37499123456")).toBe("+37499123456");
    expect(normalizePhoneToE164("37499123456")).toBe("+37499123456");
    expect(normalizePhoneToE164("0037499123456")).toBe("+37499123456");
    expect(normalizePhoneToE164("+374 99 123 456")).toBe("+37499123456");
  });

  it("rejects empty and impossible numbers", () => {
    expect(normalizePhoneToE164("")).toBeNull();
    expect(normalizePhoneToE164("123")).toBeNull();
    expect(normalizePhoneToE164("not-a-phone")).toBeNull();
  });

  it("builds lookup candidates and a MOBIPACE recipient from E.164", () => {
    expect(phoneLookupCandidates("+37499123456")).toEqual(
      expect.arrayContaining([
        "+37499123456",
        "37499123456",
        "0037499123456",
        "99123456",
        "099123456",
      ]),
    );
    expect(phoneMatchDigits("+37499123456")).toContain("37499123456");
    expect(toMobipaceRecipient("+37499123456")).toBe("37499123456");
    expect(toMobipaceRecipient("37499123456")).toBeNull();
  });
});
