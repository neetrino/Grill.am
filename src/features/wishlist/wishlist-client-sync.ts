"use client";

import { useEffect, useSyncExternalStore } from "react";

type Listener = () => void;

type WishlistClientSnapshot = {
  /** Optimistic membership per product id, until the RSC payload catches up. */
  overrides: ReadonlyMap<string, boolean>;
  /** Pending badge delta applied on top of the latest server count. */
  countDelta: number;
};

let snapshot: WishlistClientSnapshot = {
  overrides: new Map(),
  countDelta: 0,
};
const listeners = new Set<Listener>();

function setSnapshot(next: WishlistClientSnapshot): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeWishlistSync(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Optimistically mark a product as wished / unwished for every mounted heart. */
export function setWishlistOverride(
  productId: string,
  inWishlist: boolean,
): void {
  if (snapshot.overrides.get(productId) === inWishlist) {
    return;
  }
  const overrides = new Map(snapshot.overrides);
  overrides.set(productId, inWishlist);
  setSnapshot({ ...snapshot, overrides });
}

/** Drop an override once the server payload reports the same value. */
export function clearWishlistOverride(productId: string): void {
  if (!snapshot.overrides.has(productId)) {
    return;
  }
  const overrides = new Map(snapshot.overrides);
  overrides.delete(productId);
  setSnapshot({ ...snapshot, overrides });
}

/** Shift the badge count before the server responds (`+1` / `-1`). */
export function adjustWishlistCountDelta(delta: number): void {
  if (delta === 0) {
    return;
  }
  setSnapshot({ ...snapshot, countDelta: snapshot.countDelta + delta });
}

function resetWishlistCountDelta(): void {
  if (snapshot.countDelta === 0) {
    return;
  }
  setSnapshot({ ...snapshot, countDelta: 0 });
}

/**
 * Heart state for one product: optimistic value wins until the server agrees.
 */
export function useWishlistMembership(
  productId: string,
  serverInWishlist: boolean,
): boolean {
  const override = useSyncExternalStore(
    subscribeWishlistSync,
    () => snapshot.overrides.get(productId),
    () => undefined,
  );

  useEffect(() => {
    if (override === serverInWishlist) {
      clearWishlistOverride(productId);
    }
  }, [override, productId, serverInWishlist]);

  return override ?? serverInWishlist;
}

/**
 * Badge count: server count plus pending local toggles. The delta resets as
 * soon as a fresh server count arrives, so both stay in sync after `refresh()`.
 */
export function useWishlistCount(serverCount: number): number {
  const countDelta = useSyncExternalStore(
    subscribeWishlistSync,
    () => snapshot.countDelta,
    () => 0,
  );

  useEffect(() => {
    resetWishlistCountDelta();
  }, [serverCount]);

  return Math.max(0, serverCount + countDelta);
}
