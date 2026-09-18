import { describe, expect, it } from "vitest";

import {
  parseProfileSheetParam,
  profileBonusesPageHref,
  profileCoinsHref,
  signedInCoinsHref,
} from "@/features/profile/ui/profile-sheet";

describe("profileCoinsHref", () => {
  it("opens the bonuses sheet on the profile hub", () => {
    expect(profileCoinsHref("hy")).toBe("/hy/profile?sheet=bonuses");
  });
});

describe("signedInCoinsHref", () => {
  it("uses the sheet on mobile and the bonuses page on desktop", () => {
    expect(signedInCoinsHref("hy", false)).toBe("/hy/profile?sheet=bonuses");
    expect(signedInCoinsHref("hy", true)).toBe("/hy/profile/bonuses");
    expect(profileBonusesPageHref("hy")).toBe("/hy/profile/bonuses");
  });
});

describe("parseProfileSheetParam", () => {
  it("accepts the bonuses sheet flag", () => {
    expect(parseProfileSheetParam("bonuses")).toBe("bonuses");
    expect(parseProfileSheetParam(["bonuses"])).toBe("bonuses");
  });

  it("rejects unknown or empty values", () => {
    expect(parseProfileSheetParam("orders")).toBeNull();
    expect(parseProfileSheetParam(undefined)).toBeNull();
    expect(parseProfileSheetParam(null)).toBeNull();
  });
});
