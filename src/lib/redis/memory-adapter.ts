import type { RedisAdapter, RedisClient } from "@/lib/redis/types";

type Entry = {
  value: string;
  expiresAt: number | null;
};

function readEntry(store: Map<string, Entry>, key: string): Entry | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry;
}

/** In-memory Redis stand-in when Upstash REST credentials are absent. */
export function createMemoryRedisAdapter(): RedisAdapter {
  const store = new Map<string, Entry>();

  const client: RedisClient = {
    async get(key) {
      return readEntry(store, key)?.value ?? null;
    },
    async set(key, value, options) {
      if (options?.nx && store.has(key)) {
        const existing = store.get(key);
        if (
          existing &&
          (existing.expiresAt === null || Date.now() < existing.expiresAt)
        ) {
          return null;
        }
      }

      store.set(key, {
        value,
        expiresAt:
          typeof options?.ex === "number"
            ? Date.now() + options.ex * 1000
            : null,
      });

      return "OK";
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async getdel(key) {
      const entry = readEntry(store, key);
      if (!entry) {
        return null;
      }

      store.delete(key);
      return entry.value;
    },
    async incr(key) {
      const entry = readEntry(store, key);
      const current = entry ? Number(entry.value) : 0;
      if (!Number.isInteger(current)) {
        throw new Error("Redis value is not an integer");
      }

      const next = current + 1;
      store.set(key, {
        value: String(next),
        expiresAt: entry?.expiresAt ?? null,
      });
      return next;
    },
    async expire(key, seconds) {
      const entry = readEntry(store, key);
      if (!entry) {
        return 0;
      }

      entry.expiresAt = Date.now() + seconds * 1000;
      store.set(key, entry);
      return 1;
    },
  };

  return {
    name: "memory",
    getClient: () => client,
  };
}
