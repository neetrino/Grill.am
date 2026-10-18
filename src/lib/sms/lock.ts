import { randomBytes, randomInt } from "node:crypto";

import { SmsTransportError } from "@/lib/sms/errors";
import type { RedisClient } from "@/lib/redis/types";

const LOCK_KEY = "sms:mobipace:lock";
const LOCK_WAIT_MS = 8_000;

/**
 * Worst case while the lock is held:
 * 2 Authorize calls + 5 SendSMS calls (first send, re-authorize send,
 * and 3 busy retries), each capped at 12s, plus busy delays 200+350+500ms.
 * 7 * 12s + 1.05s = 85.05s. 120s leaves margin so the holder does not
 * lose the lock before the vendor calls finish.
 */
export const MOBIPACE_LOCK_TTL_SECONDS = 120;
const MOBIPACE_LOCK_HOLD_BUDGET_MS = 7 * 12_000 + 200 + 350 + 500;

/**
 * MOBIPACE accepts one in-flight request per account.
 * This lock serializes our calls across app instances via shared Redis.
 * Release deletes the key only when it still holds this caller's token.
 */
export async function withMobipaceLock<T>(
  redis: RedisClient,
  task: () => Promise<T>,
): Promise<T> {
  const token = randomBytes(16).toString("hex");
  const acquired = await acquireLock(redis, token);
  if (!acquired) {
    throw new SmsTransportError("busy");
  }

  try {
    return await task();
  } finally {
    await redis.compareAndDelete(LOCK_KEY, token);
  }
}

/** Exported so tests can assert the TTL covers the provider's worst case. */
export function mobipaceLockCoversHoldBudget(): boolean {
  return MOBIPACE_LOCK_TTL_SECONDS * 1000 >= MOBIPACE_LOCK_HOLD_BUDGET_MS + 30_000;
}

async function acquireLock(redis: RedisClient, token: string): Promise<boolean> {
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    const result = await redis.set(LOCK_KEY, token, {
      nx: true,
      ex: MOBIPACE_LOCK_TTL_SECONDS,
    });
    if (result === "OK") {
      return true;
    }
    await delay(40 + randomInt(0, 40));
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
