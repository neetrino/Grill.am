import { describe, expect, it } from "vitest";

import { createMemoryRedisAdapter } from "@/lib/redis/memory-adapter";

describe("memory redis adapter", () => {
  it("sets and gets values with nx semantics", async () => {
    const redis = createMemoryRedisAdapter().getClient();

    await expect(redis.set("k", "1", { nx: true })).resolves.toBe("OK");
    await expect(redis.set("k", "2", { nx: true })).resolves.toBeNull();
    await expect(redis.get("k")).resolves.toBe("1");
    await expect(redis.del("k")).resolves.toBe(1);
    await expect(redis.get("k")).resolves.toBeNull();
  });

  it("getdel returns the value once and removes the key", async () => {
    const redis = createMemoryRedisAdapter().getClient();

    await redis.set("token", "user-1", { ex: 60 });
    await expect(redis.getdel("token")).resolves.toBe("user-1");
    await expect(redis.getdel("token")).resolves.toBeNull();
    await expect(redis.get("token")).resolves.toBeNull();
  });

  it("compareAndDelete removes only the matching token", async () => {
    const redis = createMemoryRedisAdapter().getClient();

    await redis.set("lock", "owner-b", { ex: 120 });
    await expect(redis.compareAndDelete("lock", "owner-a")).resolves.toBe(0);
    await redis.set("lock", "owner-c", { ex: 120 });
    await expect(redis.compareAndDelete("lock", "owner-b")).resolves.toBe(0);
    await expect(redis.get("lock")).resolves.toBe("owner-c");
    await expect(redis.compareAndDelete("lock", "owner-c")).resolves.toBe(1);
  });
});
