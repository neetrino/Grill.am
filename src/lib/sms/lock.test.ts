import { describe, expect, it } from "vitest";

import { createMemoryRedisAdapter } from "@/lib/redis/memory-adapter";
import {
  MOBIPACE_LOCK_TTL_SECONDS,
  mobipaceLockCoversHoldBudget,
  withMobipaceLock,
} from "@/lib/sms/lock";

const LOCK_KEY = "sms:mobipace:lock";

describe("MOBIPACE lock", () => {
  it("uses a TTL that covers the longest provider sequence", () => {
    expect(MOBIPACE_LOCK_TTL_SECONDS).toBe(120);
    expect(mobipaceLockCoversHoldBudget()).toBe(true);
  });

  it("lets the owner release the lock for the next caller", async () => {
    const redis = createMemoryRedisAdapter().getClient();
    const order: string[] = [];

    await withMobipaceLock(redis, async () => {
      order.push("first");
    });
    await withMobipaceLock(redis, async () => {
      order.push("second");
    });

    expect(order).toEqual(["first", "second"]);
    await expect(redis.get(LOCK_KEY)).resolves.toBeNull();
  });

  it("does not release a lock owned by someone else", async () => {
    const redis = createMemoryRedisAdapter().getClient();
    await redis.set(LOCK_KEY, "owner-b", { ex: MOBIPACE_LOCK_TTL_SECONDS });

    await expect(redis.compareAndDelete(LOCK_KEY, "owner-a")).resolves.toBe(0);
    await expect(redis.get(LOCK_KEY)).resolves.toBe("owner-b");
  });

  it("does not let a stale token delete a replacement lock", async () => {
    const redis = createMemoryRedisAdapter().getClient();
    await redis.set(LOCK_KEY, "expired-owner", { ex: 0 });
    await expect(
      redis.compareAndDelete(LOCK_KEY, "expired-owner"),
    ).resolves.toBe(0);

    await redis.set(LOCK_KEY, "new-owner", { ex: MOBIPACE_LOCK_TTL_SECONDS });
    await expect(
      redis.compareAndDelete(LOCK_KEY, "expired-owner"),
    ).resolves.toBe(0);
    await expect(redis.get(LOCK_KEY)).resolves.toBe("new-owner");
  });
});
