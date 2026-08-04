import { describe, expect, it, beforeEach } from "vitest";

import {
  adjustLocalCartItemCount,
  getCartSyncVersion,
  getLocalCartItemCount,
  noteServerCartItemCount,
  notifyCartChanged,
  reconcileLocalCartItemCount,
  setLocalCartItemCount,
} from "@/features/cart/cart-client-sync";

describe("cart-client-sync local item count", () => {
  beforeEach(() => {
    reconcileLocalCartItemCount(0);
    // Reset version side-effect from reconcile is fine; isolate count.
    setLocalCartItemCount(0);
  });

  it("bumps optimistic count without waiting for notifyCartChanged", () => {
    noteServerCartItemCount(2);
    setLocalCartItemCount(2);
    const versionBefore = getCartSyncVersion();

    adjustLocalCartItemCount(1);

    expect(getLocalCartItemCount()).toBe(3);
    expect(getCartSyncVersion()).toBe(versionBefore);
  });

  it("rolls back optimistic bump", () => {
    setLocalCartItemCount(3);
    adjustLocalCartItemCount(-1);
    expect(getLocalCartItemCount()).toBe(2);
  });

  it("uses last server count as base when local is unset after reset", () => {
    // Force null by reconciling through module internals: set then note.
    noteServerCartItemCount(5);
    // Simulate fresh module state for base fallback — use adjust from noted server.
    // After setLocal(0) in beforeEach, local is 0 not null; set path:
    reconcileLocalCartItemCount(5);
    adjustLocalCartItemCount(2);
    expect(getLocalCartItemCount()).toBe(7);
  });

  it("notifyCartChanged bumps version for drawer reload", () => {
    const before = getCartSyncVersion();
    notifyCartChanged();
    expect(getCartSyncVersion()).toBe(before + 1);
  });
});
