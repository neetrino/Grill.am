import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import { SmsTransportError } from "@/lib/sms/errors";
import type { RedisClient } from "@/lib/redis/types";

const LOCK_KEY = "sms:mobipace:lock";
const LOCK_TTL_SECONDS = 25;
const LOCK_WAIT_MS = 8_000;

/**
 * MOBIPACE accepts one in-flight request per account.
 * This lock serializes our calls across app instances via Redis.
 */
export async function withMobipaceLock<T>(
  redis: RedisClient,
  task: () => Promise<T>,
): Promise<T> {
  const token = randomBytes(16).toString("hex");
  const deadline = Date.now() + LOCK_WAIT_MS;
  let acquired = false;

  while (Date.now() < deadline) {
    const result = await redis.set(LOCK_KEY, token, {
      nx: true,
      ex: LOCK_TTL_SECONDS,
    });
    if (result === "OK") {
      acquired = true;
      break;
    }
    await delay(40 + randomIntBelow(40));
  }

  if (!acquired) {
    throw new SmsTransportError("busy");
  }

  try {
    return await task();
  } finally {
    const current = await redis.get(LOCK_KEY);
    if (current && tokensMatch(current, token)) {
      await redis.del(LOCK_KEY);
    }
  }
}

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function randomIntBelow(max: number): number {
  return randomInt(0, max);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
