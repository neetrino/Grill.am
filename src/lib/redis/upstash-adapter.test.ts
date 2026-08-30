import { describe, expect, it } from "vitest";

import {
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
});
