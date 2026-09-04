type CartMinOrderBlockedListener = (minQty: number) => void;

const listeners = new Set<CartMinOrderBlockedListener>();

/** Subscribe to min-order blocks (e.g. toast host). */
export function subscribeCartMinOrderBlocked(
  listener: CartMinOrderBlockedListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fired when a cart mutation is raised to the product minimum. */
export function notifyCartMinOrderBlocked(minQty: number): void {
  for (const listener of listeners) {
    listener(minQty);
  }
}
