import { describe, expect, it } from "vitest";

import {
  AUTH_FROM_COINS,
  guestCoinsLoginHref,
  isCoinsAuthEntry,
} from "@/features/auth/guest-coins-login";

describe("guestCoinsLoginHref", () => {
  it("sends guests to login with coins context and bonuses next path", () => {
    expect(guestCoinsLoginHref("hy")).toBe(
      `/hy/login?from=${AUTH_FROM_COINS}&next=${encodeURIComponent("/hy/profile/bonuses")}`,
    );
  });
});

describe("isCoinsAuthEntry", () => {
  it("accepts the coins query flag", () => {
    expect(isCoinsAuthEntry("coins")).toBe(true);
    expect(isCoinsAuthEntry(["coins"])).toBe(true);
    expect(isCoinsAuthEntry("login")).toBe(false);
    expect(isCoinsAuthEntry(undefined)).toBe(false);
  });
});
