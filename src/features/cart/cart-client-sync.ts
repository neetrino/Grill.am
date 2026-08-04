"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

let version = 0;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCartSync(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartSyncVersion(): number {
  return version;
}

/** Signal that durable cart contents changed — all cart UIs should reload. */
export function notifyCartChanged(): void {
  version += 1;
  emit();
}

/** Shared cart revision for drawer, sidebar, and header trigger sync. */
export function useCartSyncVersion(): number {
  return useSyncExternalStore(
    subscribeCartSync,
    getCartSyncVersion,
    () => 0,
  );
}
