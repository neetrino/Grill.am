export type RedisClient = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { ex?: number; nx?: boolean },
  ): Promise<"OK" | null>;
  del(key: string): Promise<number>;
  /** Atomically reads and deletes a key (single-use token consume). */
  getdel(key: string): Promise<string | null>;
  /** Increments an integer value, creating it at 1 when missing. */
  incr(key: string): Promise<number>;
  /** Sets a TTL in seconds. Returns 1 when the key exists. */
  expire(key: string, seconds: number): Promise<number>;
  /**
   * Deletes `key` only when its current value equals `token`.
   * Returns 1 when this caller deleted the key, otherwise 0.
   */
  compareAndDelete(key: string, token: string): Promise<number>;
};

export type RedisAdapter = {
  readonly name: string;
  getClient(): RedisClient;
};
