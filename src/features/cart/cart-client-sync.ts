"use client";

import { useEffect, useSyncExternalStore } from "react";

type Listener = () => void;

type CartClientSnapshot = {
  /** Bumped when durable cart contents should reload from the server. */
  version: number;
  /** Optimistic item count for badges; null until first local write/reconcile. */
  localItemCount: number | null;
};

let snapshot: CartClientSnapshot = {
  version: 0,
  localItemCount: null,
};
/** Last RSC/server count — base for optimistic bumps before local is seeded. */
let lastServerItemCount = 0;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(next: CartClientSnapshot): void {
  snapshot = next;
  emit();
}

export function subscribeCartSync(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartSyncVersion(): number {
  return snapshot.version;
}

export function getLocalCartItemCount(): number | null {
  return snapshot.localItemCount;
}

/** Remember the latest server-provided count (no emit). */
export function noteServerCartItemCount(count: number): void {
  lastServerItemCount = Math.max(0, Math.floor(count));
}

/** Signal that durable cart contents changed — all cart UIs should reload. */
export function notifyCartChanged(): void {
  setSnapshot({
    ...snapshot,
    version: snapshot.version + 1,
  });
}

/** Set optimistic badge count immediately (clamped to ≥ 0). */
export function setLocalCartItemCount(count: number): void {
  const next = Math.max(0, Math.floor(count));
  if (snapshot.localItemCount === next) {
    return;
  }
  setSnapshot({
    ...snapshot,
    localItemCount: next,
  });
}

/** Adjust optimistic item count before the server responds. */
export function adjustLocalCartItemCount(delta: number): void {
  if (delta === 0) {
    return;
  }
  const base = snapshot.localItemCount ?? lastServerItemCount;
  setLocalCartItemCount(base + delta);
}

/** Align local badge with a trusted server/view count after load or rollback. */
export function reconcileLocalCartItemCount(serverCount: number): void {
  noteServerCartItemCount(serverCount);
  setLocalCartItemCount(serverCount);
}

/** Shared cart revision for drawer, sidebar, and header trigger sync. */
export function useCartSyncVersion(): number {
  return useSyncExternalStore(
    subscribeCartSync,
    getCartSyncVersion,
    () => 0,
  );
}

/**
 * Badge item count: prefers optimistic local value, else the RSC/server count.
 */
export function useCartItemCount(serverItemCount: number): number {
  noteServerCartItemCount(serverItemCount);

  useEffect(() => {
    if (getLocalCartItemCount() === null) {
      reconcileLocalCartItemCount(serverItemCount);
    }
  }, [serverItemCount]);

  const localItemCount = useSyncExternalStore(
    subscribeCartSync,
    getLocalCartItemCount,
    () => null,
  );

  return localItemCount ?? serverItemCount;
}
