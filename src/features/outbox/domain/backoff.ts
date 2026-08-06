/**
 * Bounded exponential backoff with optional deterministic jitter for tests.
 */

export type BackoffInput = {
  attemptNumber: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** 0..1 — injected for tests; random when omitted. */
  jitterRatio?: number;
};

const DEFAULT_BASE_MS = 5_000;
const DEFAULT_MAX_MS = 15 * 60_000;

export function computeOutboxBackoffMs(input: BackoffInput): number {
  const base = input.baseDelayMs ?? DEFAULT_BASE_MS;
  const max = input.maxDelayMs ?? DEFAULT_MAX_MS;
  const attempt = Math.max(1, input.attemptNumber);
  const exp = Math.min(max, base * 2 ** (attempt - 1));
  const jitterRatio =
    input.jitterRatio ?? Math.min(0.25, Math.random() * 0.25);
  const jitter = Math.floor(exp * jitterRatio);
  return Math.min(max, exp + jitter);
}
