"use client";

import { useSyncExternalStore } from "react";

import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";

type Listener = () => void;

export type OptimisticCartLineInput = {
  productId: string;
  selectionKey: string;
  title: string;
  slug: string;
  quantity: number;
  imageUrl: string | null;
  unitPriceFormatted: string;
  modifierLines: string[];
};

export type UpsertItemLocallyResult = {
  /** Full drawer snapshot before this upsert (for coarse restore). */
  previousView: CartDrawerView | null;
  /** Line state before quantity change; null when the line was created. */
  previousItem: CartDrawerItemView | null;
  nextItem: CartDrawerItemView;
  quantityDelta: number;
  created: boolean;
};

let view: CartDrawerView | null = null;
/** Counts in-flight optimistic adds that have not reconciled yet. */
let pendingOptimisticAdds = 0;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setView(next: CartDrawerView | null): void {
  view = next;
  emit();
}

function recomputeItemCount(items: CartDrawerItemView[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function withUpdatedCounts(current: CartDrawerView): CartDrawerView {
  return {
    ...current,
    itemCount: recomputeItemCount(current.items),
    // Totals stay approximate until server reconcile; keep placeholders stable.
    subtotalFormatted: current.subtotalFormatted || "…",
    shippingFormatted: current.shippingFormatted || "…",
    totalFormatted: current.totalFormatted || "…",
  };
}

function emptyView(items: CartDrawerItemView[]): CartDrawerView {
  return withUpdatedCounts({
    itemCount: 0,
    items,
    subtotalFormatted: "…",
    shippingFormatted: "…",
    totalFormatted: "…",
  });
}

export function cartLineMatchKey(
  productId: string,
  selectionKey: string,
): string {
  return `${productId}::${selectionKey}`;
}

export function optimisticCartLineId(
  productId: string,
  selectionKey: string,
): string {
  return `optimistic:${cartLineMatchKey(productId, selectionKey)}`;
}

function itemMatchKey(item: CartDrawerItemView): string | null {
  if (item.productId == null) {
    return null;
  }
  return cartLineMatchKey(item.productId, item.selectionKey ?? "");
}

export function subscribeCartDrawerLocal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartDrawerLocalView(): CartDrawerView | null {
  return view;
}

export function getPendingOptimisticAdds(): number {
  return pendingOptimisticAdds;
}

/**
 * Replaces local drawer state with the authoritative server payload.
 * Preserves still-pending optimistic lines that the server has not echoed yet.
 */
export function replaceCartDrawerViewFromServer(
  serverView: CartDrawerView,
): void {
  if (pendingOptimisticAdds <= 0 || view == null) {
    setView(serverView);
    return;
  }

  const serverKeys = new Set(
    serverView.items
      .map((item) => itemMatchKey(item))
      .filter((key): key is string => key != null),
  );

  const pendingExtras = view.items.filter((item) => {
    if (!item.id.startsWith("optimistic:")) {
      return false;
    }
    const key = itemMatchKey(item);
    return key != null && !serverKeys.has(key);
  });

  if (pendingExtras.length === 0) {
    setView(serverView);
    return;
  }

  setView(
    withUpdatedCounts({
      ...serverView,
      items: [...serverView.items, ...pendingExtras],
    }),
  );
}

/** Instantly upsert a cart line in the shared drawer view (before DB). */
export function upsertItemLocally(
  input: OptimisticCartLineInput,
): UpsertItemLocallyResult {
  const quantity = Math.max(1, Math.floor(input.quantity));
  const previousView = view;
  const matchKey = cartLineMatchKey(input.productId, input.selectionKey);
  const current = view ?? emptyView([]);
  const existingIndex = current.items.findIndex(
    (item) => itemMatchKey(item) === matchKey,
  );

  pendingOptimisticAdds += 1;

  if (existingIndex >= 0) {
    const previousItem = current.items[existingIndex]!;
    const nextItem: CartDrawerItemView = {
      ...previousItem,
      productId: input.productId,
      selectionKey: input.selectionKey,
      quantity: previousItem.quantity + quantity,
      title: input.title || previousItem.title,
      slug: input.slug || previousItem.slug,
      imageUrl: input.imageUrl ?? previousItem.imageUrl,
      unitPriceFormatted:
        input.unitPriceFormatted || previousItem.unitPriceFormatted,
      modifierLines:
        input.modifierLines.length > 0
          ? input.modifierLines
          : previousItem.modifierLines,
    };
    const items = current.items.map((item, index) =>
      index === existingIndex ? nextItem : item,
    );
    setView(withUpdatedCounts({ ...current, items }));
    return {
      previousView,
      previousItem,
      nextItem,
      quantityDelta: quantity,
      created: false,
    };
  }

  const nextItem: CartDrawerItemView = {
    id: optimisticCartLineId(input.productId, input.selectionKey),
    productId: input.productId,
    selectionKey: input.selectionKey,
    title: input.title,
    slug: input.slug,
    quantity,
    imageUrl: input.imageUrl,
    unitPriceFormatted: input.unitPriceFormatted,
    modifierLines: input.modifierLines,
  };
  const items = [...current.items, nextItem];
  setView(withUpdatedCounts({ ...current, items }));
  return {
    previousView,
    previousItem: null,
    nextItem,
    quantityDelta: quantity,
    created: true,
  };
}

/** Rolls back a single optimistic upsert without wiping newer local edits. */
export function rollbackUpsertLocally(
  result: UpsertItemLocallyResult,
): void {
  pendingOptimisticAdds = Math.max(0, pendingOptimisticAdds - 1);
  const current = view;
  if (!current) {
    setView(result.previousView);
    return;
  }

  const matchKey = itemMatchKey(result.nextItem);
  const index = current.items.findIndex(
    (item) =>
      item.id === result.nextItem.id ||
      (matchKey != null && itemMatchKey(item) === matchKey),
  );

  if (index < 0) {
    emit();
    return;
  }

  if (result.created || result.previousItem == null) {
    const items = current.items.filter((_, i) => i !== index);
    setView(withUpdatedCounts({ ...current, items }));
    return;
  }

  const restoredQty = Math.max(
    0,
    current.items[index]!.quantity - result.quantityDelta,
  );
  if (restoredQty < 1) {
    const items = current.items.filter((_, i) => i !== index);
    setView(withUpdatedCounts({ ...current, items }));
    return;
  }

  const items = current.items.map((item, i) =>
    i === index
      ? { ...result.previousItem!, quantity: restoredQty }
      : item,
  );
  setView(withUpdatedCounts({ ...current, items }));
}

/** Marks one optimistic add as reconciled after a successful server write. */
export function acknowledgeOptimisticAdd(): void {
  pendingOptimisticAdds = Math.max(0, pendingOptimisticAdds - 1);
}

export function removeItemLocallyShared(
  itemId: string,
): CartDrawerItemView | null {
  const current = view;
  if (!current) {
    return null;
  }
  const item = current.items.find((row) => row.id === itemId);
  if (!item) {
    return null;
  }
  const items = current.items.filter((row) => row.id !== itemId);
  setView(withUpdatedCounts({ ...current, items }));
  return item;
}

export function setQuantityLocallyShared(
  itemId: string,
  quantity: number,
): { previous: CartDrawerItemView; nextQuantity: number } | null {
  if (quantity < 1) {
    const removed = removeItemLocallyShared(itemId);
    if (!removed) {
      return null;
    }
    return { previous: removed, nextQuantity: 0 };
  }

  const current = view;
  if (!current) {
    return null;
  }
  const previous = current.items.find((row) => row.id === itemId);
  if (!previous) {
    return null;
  }
  const items = current.items.map((row) =>
    row.id === itemId ? { ...row, quantity } : row,
  );
  setView(withUpdatedCounts({ ...current, items }));
  return { previous, nextQuantity: quantity };
}

export function restoreItemLocallyShared(item: CartDrawerItemView): void {
  const current = view;
  let next: CartDrawerView;
  if (!current) {
    next = emptyView([item]);
  } else if (current.items.some((row) => row.id === item.id)) {
    const items = current.items.map((row) =>
      row.id === item.id ? item : row,
    );
    next = withUpdatedCounts({ ...current, items });
  } else {
    next = withUpdatedCounts({
      ...current,
      items: [...current.items, item],
    });
  }
  setView(next);
}

/** Shared drawer view for every mounted cart UI. */
export function useCartDrawerLocalView(): CartDrawerView | null {
  return useSyncExternalStore(
    subscribeCartDrawerLocal,
    getCartDrawerLocalView,
    () => null,
  );
}

/** Test helper — resets module state between unit tests. */
export function resetCartDrawerLocalStoreForTests(): void {
  view = null;
  pendingOptimisticAdds = 0;
  emit();
}
