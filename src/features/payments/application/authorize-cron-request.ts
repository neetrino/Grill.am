import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Authorizes Vercel Cron / ops callers via `Authorization: Bearer <CRON_SECRET>`.
 * Returns false when the secret is unset or the header does not match.
 */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const token = header.slice("Bearer ".length).trim();
  const expected = Buffer.from(secret, "utf8");
  const actual = Buffer.from(token, "utf8");
  if (expected.length === 0 || expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
