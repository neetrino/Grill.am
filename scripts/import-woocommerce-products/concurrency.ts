/** Runs async work over items with a fixed concurrency limit. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      const item = items[current];
      if (item === undefined) continue;
      results[current] = await worker(item, current);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    run(),
  );
  await Promise.all(runners);
  return results;
}
