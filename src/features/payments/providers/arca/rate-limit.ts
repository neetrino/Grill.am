/**
 * Simple in-memory sliding-window rate limiter for payment routes.
 * Prefer Redis in production when Upstash is configured; memory is safe for single-node.
 */
type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = args.now ?? Date.now();
  const bucket = buckets.get(args.key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter(
    (ts) => now - ts < args.windowMs,
  );

  if (bucket.timestamps.length >= args.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    buckets.set(args.key, bucket);
    return { ok: false, retryAfterMs: Math.max(0, args.windowMs - (now - oldest)) };
  }

  bucket.timestamps.push(now);
  buckets.set(args.key, bucket);
  return { ok: true };
}

/** Test-only reset. */
export function resetPaymentRateLimitsForTests(): void {
  buckets.clear();
}
