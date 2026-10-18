import "server-only";

import { headers } from "next/headers";

/** Best-effort client IP for rate limits behind the platform proxy. */
export async function getRequestClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) {
    return first.slice(0, 64);
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 64);
  }

  return "unknown";
}
