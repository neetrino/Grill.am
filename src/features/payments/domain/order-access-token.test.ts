import { describe, expect, it } from "vitest";

import {
  generateGuestOrderAccessToken,
  hashGuestOrderAccessToken,
  orderAccessCookieName,
  verifyGuestOrderAccessToken,
} from "@/features/payments/domain/order-access-token";

describe("guest order access token", () => {
  it("verifies a generated token against its hash", () => {
    const token = generateGuestOrderAccessToken();
    expect(
      verifyGuestOrderAccessToken(
        token.rawToken,
        token.tokenHash,
        token.expiresAt,
      ),
    ).toBe(true);
  });

  it("rejects a token for a different hash", () => {
    const a = generateGuestOrderAccessToken();
    const b = generateGuestOrderAccessToken();
    expect(
      verifyGuestOrderAccessToken(a.rawToken, b.tokenHash, b.expiresAt),
    ).toBe(false);
  });

  it("rejects expired tokens", () => {
    const token = generateGuestOrderAccessToken();
    const expired = new Date(Date.now() - 1000);
    expect(
      verifyGuestOrderAccessToken(token.rawToken, token.tokenHash, expired),
    ).toBe(false);
  });

  it("hashes deterministically", () => {
    expect(hashGuestOrderAccessToken("abc")).toBe(
      hashGuestOrderAccessToken("abc"),
    );
  });

  it("builds a cookie name from the order number", () => {
    expect(orderAccessCookieName("p42")).toBe("order_access_p42");
  });
});
