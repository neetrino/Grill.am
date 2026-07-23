import { describe, expect, it } from "vitest";

import {
  MAX_POPUPS,
  popupRuleErrorMessage,
  validatePopupCreateCount,
} from "@/features/popups/domain/popup-rules";

describe("popup rules", () => {
  it("allows create under the max", () => {
    expect(validatePopupCreateCount(0)).toBeNull();
    expect(validatePopupCreateCount(MAX_POPUPS - 1)).toBeNull();
  });

  it("blocks create at the max", () => {
    expect(validatePopupCreateCount(MAX_POPUPS)).toBe("MAX_POPUPS_REACHED");
    expect(validatePopupCreateCount(MAX_POPUPS + 1)).toBe("MAX_POPUPS_REACHED");
  });

  it("returns readable messages", () => {
    expect(popupRuleErrorMessage("MAX_POPUPS_REACHED")).toContain(String(MAX_POPUPS));
    expect(popupRuleErrorMessage("IMAGE_REQUIRED")).toMatch(/image/i);
  });
});
