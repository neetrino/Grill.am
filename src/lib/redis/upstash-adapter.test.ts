import { describe, expect, it } from "vitest";

import {
  COMPARE_AND_DELETE_SCRIPT,
  createUpstashRedisAdapter,
  type UpstashRedisCommands,
} from "@/lib/redis/upstash-adapter";

function createFakeUpstash(): UpstashRedisCommands {
  const store = new Map<string, unknown>();

  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async set(key, value, options) {
      if (options?.nx && store.has(key)) {
        return null;
      }
      store.set(key, value);
      return "OK";
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async getdel(key) {
      if (!store.has(key)) {
        return null;
      }
      const value = store.get(key);
      store.delete(key);
      return value ?? null;
    },
    async incr(key) {
      const current = Number(store.get(key) ?? 0);
      const next = current + 1;
      store.set(key, next);
      return next;
    },
    async expire() {
      return 1;
    },
    async eval(script, keys, args) {
      if (script !== COMPARE_AND_DELETE_SCRIPT) {
        throw new Error("unexpected script");
      }
      const key = keys[0] ?? "";
      const token = args[0] ?? "";
      if (store.get(key) !== token) {
        return 0;
      }
      store.delete(key);
      return 1;
    },
  };
}

const unusedConfig = {
  url: "https://example.upstash.io",
  token: "test-token",
};

describe("upstash redis adapter", () => {
  it("round-trips strings and honors nx", async () => {
    const redis = createUpstashRedisAdapter(
      unusedConfig,
      createFakeUpstash(),
    ).getClient();

    await expect(redis.set("k", "1", { nx: true })).resolves.toBe("OK");
    await expect(redis.set("k", "2", { nx: true })).resolves.toBeNull();
    await expect(redis.get("k")).resolves.toBe("1");
    await expect(redis.del("k")).resolves.toBe(1);
    await expect(redis.get("k")).resolves.toBeNull();
  });

  it("getdel returns the value once and removes the key", async () => {
    const redis = createUpstashRedisAdapter(
      unusedConfig,
      createFakeUpstash(),
    ).getClient();

    await redis.set("token", "user-1", { ex: 60 });
    await expect(redis.getdel("token")).resolves.toBe("user-1");
    await expect(redis.getdel("token")).resolves.toBeNull();
  });

  it("normalizes auto-decoded JSON values to strings", async () => {
    const commands = createFakeUpstash();
    await commands.set("count", "not-used");
    const redis = createUpstashRedisAdapter(unusedConfig, {
      ...commands,
      async get() {
        return 3;
      },
      async getdel() {
        return { userId: "u1" };
      },
    }).getClient();

    await expect(redis.get("count")).resolves.toBe("3");
    await expect(redis.getdel("payload")).resolves.toBe('{"userId":"u1"}');
  });

  it("deletes a key only when the eval token matches", async () => {
    const redis = createUpstashRedisAdapter(
      unusedConfig,
      createFakeUpstash(),
    ).getClient();

    await redis.set("lock", "owner-b");
    await expect(redis.compareAndDelete("lock", "owner-a")).resolves.toBe(0);
    await expect(redis.get("lock")).resolves.toBe("owner-b");
    await expect(redis.compareAndDelete("lock", "owner-b")).resolves.toBe(1);
    await expect(redis.get("lock")).resolves.toBeNull();
  });
});
