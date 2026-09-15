import { describe, expect, it } from "vitest";

import { phoneDigits, telHref, whatsappHref } from "@/lib/phone";

describe("telHref", () => {
  it("keeps a leading plus in the tel URI", () => {
    expect(telHref("+374 33 600 700")).toBe("tel:+37433600700");
  });

  it("adds a plus when the stored number is digits only", () => {
    expect(telHref("374 10 600 700")).toBe("tel:+37410600700");
  });

  it("returns an empty tel URI when there are no digits", () => {
    expect(telHref("   ")).toBe("tel:");
  });
});

describe("whatsappHref", () => {
  it("uses digits without a plus, as wa.me requires", () => {
    expect(whatsappHref("+374 33 600 700")).toBe(
      "https://wa.me/37433600700",
    );
  });
});

describe("phoneDigits", () => {
  it("strips spaces and plus for matching", () => {
    expect(phoneDigits("+374 33 600 700")).toBe("37433600700");
  });
});
