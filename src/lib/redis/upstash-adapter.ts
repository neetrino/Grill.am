import "server-only";

import { Redis } from "@upstash/redis";

import type { RedisAdapter, RedisClient } from "@/lib/redis/types";

export type UpstashRedisAdapterConfig = {
  url: string;
  token: string;
};

/**
 * Minimal command surface used by the adapter.
 * Injected in tests so the REST client is not required.
 */
export type UpstashRedisCommands = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: string,
    options?: { ex?: number; nx?: boolean },
  ) => Promise<unknown>;
  del: (key: string) => Promise<number>;
  getdel: (key: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
};

/**
 * Upstash REST may JSON-decode values. Callers expect strings
 * (rate-limit counters, hashed tokens, serialized cache payloads).
 */
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function wrapCommands(redis: UpstashRedisCommands): RedisClient {
  return {
    async get(key) {
      return toStringOrNull(await redis.get(key));
    },
    async set(key, value, options) {
      const result = await redis.set(key, value, options);
      return result === "OK" ? "OK" : null;
    },
    async del(key) {
      return redis.del(key);
    },
    async getdel(key) {
      return toStringOrNull(await redis.getdel(key));
    },
    async incr(key) {
      const value = await redis.incr(key);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error("Redis incr failed");
      }
      return value;
    },
    async expire(key, seconds) {
      const value = await redis.expire(key, seconds);
      return typeof value === "number" ? value : 0;
    },
  };
}

function createRestCommands(
  config: UpstashRedisAdapterConfig,
): UpstashRedisCommands {
  const redis = new Redis({ url: config.url, token: config.token });

  return {
    get: (key) => redis.get(key),
    set: (key, value, options) => {
      const ex = options?.ex;
      if (typeof ex === "number" && options?.nx) {
        return redis.set(key, value, { ex, nx: true });
      }
      if (typeof ex === "number") {
        return redis.set(key, value, { ex });
      }
      if (options?.nx) {
        return redis.set(key, value, { nx: true });
      }
      return redis.set(key, value);
    },
    del: (key) => redis.del(key),
    getdel: (key) => redis.getdel(key),
    incr: (key) => redis.incr(key),
    expire: (key, seconds) => redis.expire(key, seconds),
  };
}

/** Upstash Redis REST adapter. Used when REST URL + token are present. */
export function createUpstashRedisAdapter(
  config: UpstashRedisAdapterConfig,
  commands?: UpstashRedisCommands,
): RedisAdapter {
  const redis = commands ?? createRestCommands(config);

  return {
    name: "upstash",
    getClient: () => wrapCommands(redis),
  };
}
