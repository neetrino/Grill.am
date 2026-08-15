"use client";

import { notifyCartChanged } from "@/features/cart/cart-client-sync";
import {
  acknowledgeCartLineQuantity,
  applyDesiredCartLine,
  getDisplayedCartLineQuantity,
  getPendingCartLine,
  rollbackCartLineToAcknowledged,
  type OptimisticCartLineInput,
} from "@/features/cart/cart-drawer-local-store";
import { cartLineMatchKey } from "@/features/cart/cart-line-key";
import type { SetCartLineQuantityInput } from "@/features/cart/cart-line-types";
import type { CartModifiers } from "@/features/products/domain/customization";
import { logger } from "@/lib/observability/logger";

export type CartLineMutator = (
  input: SetCartLineQuantityInput,
) => Promise<void>;

type LineRuntime = {
  productId: string;
  selectionKey: string;
  modifiers: CartModifiers | undefined;
  inFlight: boolean;
  loop: Promise<void> | null;
};

let mutateCartLine: CartLineMutator | null = null;
const runtimes = new Map<string, LineRuntime>();

function getRuntime(
  productId: string,
  selectionKey: string,
): LineRuntime {
  const key = cartLineMatchKey(productId, selectionKey);
  const existing = runtimes.get(key);
  if (existing) {
    return existing;
  }
  const created: LineRuntime = {
    productId,
    selectionKey,
    modifiers: undefined,
    inFlight: false,
    loop: null,
  };
  runtimes.set(key, created);
  return created;
}

function lineNeedsSync(runtime: LineRuntime): boolean {
  const pending = getPendingCartLine(runtime.productId, runtime.selectionKey);
  if (!pending) {
    return false;
  }
  return (
    pending.revision !== pending.acknowledgedRevision ||
    pending.desiredQuantity !== pending.acknowledgedQuantity
  );
}

async function syncLine(runtime: LineRuntime): Promise<void> {
  runtime.inFlight = true;
  try {
    while (lineNeedsSync(runtime)) {
      await syncOnce(runtime);
    }
    notifyCartChanged();
  } catch (error) {
    rollbackCartLineToAcknowledged(runtime.productId, runtime.selectionKey);
    notifyCartChanged();
    logger.error("cart.line_sync_failed", {
      productId: runtime.productId,
      selectionKey: runtime.selectionKey,
    });
    throw error;
  } finally {
    runtime.inFlight = false;
    runtime.loop = null;
  }
  if (lineNeedsSync(runtime)) {
    await ensureSync(runtime);
  }
}

async function callMutator(
  input: SetCartLineQuantityInput,
): Promise<void> {
  if (mutateCartLine) {
    await mutateCartLine(input);
    return;
  }
  const { setCartLineQuantity } = await import("@/features/cart/cart");
  await setCartLineQuantity(input);
}

async function syncOnce(runtime: LineRuntime): Promise<void> {
  const pending = getPendingCartLine(runtime.productId, runtime.selectionKey);
  const desired = getDisplayedCartLineQuantity(
    runtime.productId,
    runtime.selectionKey,
  );
  const sentRevision = pending?.revision ?? 0;
  try {
    await callMutator({
      productId: runtime.productId,
      selectionKey: runtime.selectionKey,
      quantity: desired,
      modifiers: runtime.modifiers,
    });
    acknowledgeCartLineQuantity(
      runtime.productId,
      runtime.selectionKey,
      desired,
      sentRevision,
    );
  } catch (error) {
    const latest = getDisplayedCartLineQuantity(
      runtime.productId,
      runtime.selectionKey,
    );
    if (latest === desired) {
      throw error;
    }
  }
}

function ensureSync(runtime: LineRuntime): Promise<void> {
  if (runtime.loop) {
    return runtime.loop;
  }
  runtime.loop = syncLine(runtime);
  return runtime.loop;
}

/**
 * Sets the user's desired absolute quantity and coalesces per-line server sync.
 */
export function setCartLineDesiredQuantity(input: {
  productId: string;
  selectionKey: string;
  quantity: number;
  modifiers?: CartModifiers;
  display?: OptimisticCartLineInput;
}): Promise<void> {
  const runtime = getRuntime(input.productId, input.selectionKey);
  if (input.modifiers) {
    runtime.modifiers = input.modifiers;
  }
  applyDesiredCartLine({
    productId: input.productId,
    selectionKey: input.selectionKey,
    desiredQuantity: input.quantity,
    display: input.display,
  });
  return ensureSync(runtime);
}

/** Adds to the current desired quantity (catalog / PDP add-to-cart). */
export function addCartLineQuantity(input: {
  productId: string;
  selectionKey: string;
  addQuantity: number;
  modifiers?: CartModifiers;
  display: OptimisticCartLineInput;
}): Promise<void> {
  const current = getDisplayedCartLineQuantity(
    input.productId,
    input.selectionKey,
  );
  return setCartLineDesiredQuantity({
    productId: input.productId,
    selectionKey: input.selectionKey,
    quantity: current + Math.max(0, Math.floor(input.addQuantity)),
    modifiers: input.modifiers,
    display: { ...input.display, quantity: 1 },
  });
}

export function isCartLineSyncInFlight(
  productId: string,
  selectionKey: string,
): boolean {
  return (
    runtimes.get(cartLineMatchKey(productId, selectionKey))?.inFlight ?? false
  );
}

export function setCartLineMutatorForTests(mutator: CartLineMutator): void {
  mutateCartLine = mutator;
}

export function resetCartLineCoordinatorForTests(): void {
  runtimes.clear();
  mutateCartLine = null;
}
