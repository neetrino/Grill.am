import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ORDER_ACCESS_COOKIE_PREFIX = "order_access_";
/** Guest order access cookie TTL (7 days). */
export const ORDER_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const RAW_TOKEN_BYTES = 32;

export type GuestOrderAccessToken = {
  /** Opaque raw token for the client cookie only — never persist. */
  rawToken: string;
  /** SHA-256 hex digest stored on the order. */
  tokenHash: string;
  expiresAt: Date;
};

/** Hashes a raw guest access token for durable storage. */
export function hashGuestOrderAccessToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/**
 * Creates a high-entropy guest order access token.
 * Store only `tokenHash`; return `rawToken` to the client.
 */
export function generateGuestOrderAccessToken(
  now: Date = new Date(),
  maxAgeSeconds: number = ORDER_ACCESS_COOKIE_MAX_AGE,
): GuestOrderAccessToken {
  const rawToken = randomBytes(RAW_TOKEN_BYTES).toString("base64url");
  return {
    rawToken,
    tokenHash: hashGuestOrderAccessToken(rawToken),
    expiresAt: new Date(now.getTime() + maxAgeSeconds * 1000),
  };
}

/** Timing-safe comparison of raw token against a stored hash. */
export function verifyGuestOrderAccessToken(
  rawToken: string,
  tokenHash: string | null | undefined,
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!tokenHash || !rawToken) {
    return false;
  }
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return false;
  }

  const expected = Buffer.from(tokenHash, "utf8");
  const actual = Buffer.from(hashGuestOrderAccessToken(rawToken), "utf8");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function orderAccessCookieName(orderNumber: string): string {
  return `${ORDER_ACCESS_COOKIE_PREFIX}${orderNumber}`;
}

/**
 * @deprecated Phase 1 HMAC tokens. Prefer {@link generateGuestOrderAccessToken}.
 * Kept only for temporary dual-read during migration windows if needed.
 */
export function createLegacyHmacOrderAccessToken(
  orderId: string,
  orderNumber: string,
): string {
  const secret = process.env.AUTH_SECRET || "dev-order-access-secret";
  return createHash("sha256")
    .update(`${secret}:${orderId}:${orderNumber}`)
    .digest("base64url");
}
