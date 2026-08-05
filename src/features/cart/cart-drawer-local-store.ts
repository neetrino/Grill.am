"use client";

import { useSyncExternalStore } from "react";

import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

type Listener = () => void;

export type OptimisticCartLineInput = {
  productId: string;
  selectionKey: string;
  title: string;
  slug: string;
  quantity: number;
  imageUrl: string | null;
  /** Display-currency minor units (AMD dram / USD cents / …). */
  unitPriceAmount: number;
  locale: Locale;
  currency: Currency;
  /** Optional preformatted unit price; recalculated when omitted. */
  unitPriceFormatted?: string;
  modifierLines: string[];
};

export type UpsertItemLocallyResult = {
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

function safeMoneyInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

/**
 * Derives item line totals and cart summary from integer minor-unit prices.
 * Server-only adjustments (coupons, etc.) stay on `adjustmentsAmount`.
 */
export function recalculateLocalCartView(
  current: CartDrawerView,
): CartDrawerView {
  const { locale, currency } = current;
  const adjustmentsAmount = safeMoneyInteger(current.adjustmentsAmount ?? 0);

  const items = current.items.map((item) => {
    const unitPriceAmount = safeMoneyInteger(item.unitPriceAmount ?? 0);
    const lineTotalAmount = unitPriceAmount * item.quantity;
    return {
      ...item,
      unitPriceAmount,
      lineTotalAmount,
      unitPriceFormatted: formatMoneyAmount(
        unitPriceAmount,
        currency,
        locale,
      ),
      lineTotalFormatted: formatMoneyAmount(
        lineTotalAmount,
        currency,
        locale,
      ),
    };
  });

  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.lineTotalAmount,
    0,
  );
  // Shipping is displayed separately; total stays merchandise ± server adjustments.
  const totalAmount = Math.max(0, subtotalAmount + adjustmentsAmount);
  const shippingAmount = safeMoneyInteger(current.shippingAmount ?? 0);

  return {
    ...current,
    locale,
    currency,
    items,
    itemCount: recomputeItemCount(items),
    subtotalAmount,
    totalAmount,
    adjustmentsAmount,
    shippingAmount,
    subtotalFormatted: formatMoneyAmount(subtotalAmount, currency, locale),
    shippingFormatted:
      current.shippingFormatted ||
      formatMoneyAmount(shippingAmount, currency, locale),
    totalFormatted: formatMoneyAmount(totalAmount, currency, locale),
  };
}

function emptyView(
  items: CartDrawerItemView[],
  locale: Locale,
  currency: Currency,
): CartDrawerView {
  return recalculateLocalCartView({
    locale,
    currency,
    itemCount: 0,
    items,
    subtotalAmount: 0,
    totalAmount: 0,
    adjustmentsAmount: 0,
    shippingAmount: 0,
    subtotalFormatted: formatMoneyAmount(0, currency, locale),
    shippingFormatted: formatMoneyAmount(0, currency, locale),
    totalFormatted: formatMoneyAmount(0, currency, locale),
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
    recalculateLocalCartView({
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
  const unitPriceAmount = safeMoneyInteger(input.unitPriceAmount);
  const matchKey = cartLineMatchKey(input.productId, input.selectionKey);
  const current =
    view ?? emptyView([], input.locale, input.currency);
  const existingIndex = current.items.findIndex(
    (item) => itemMatchKey(item) === matchKey,
  );

  pendingOptimisticAdds += 1;

  const baseView: CartDrawerView = {
    ...current,
    locale: input.locale,
    currency: input.currency,
  };

  if (existingIndex >= 0) {
    const previousItem = current.items[existingIndex]!;
    const nextQuantity = previousItem.quantity + quantity;
    const nextItem: CartDrawerItemView = {
      ...previousItem,
      productId: input.productId,
      selectionKey: input.selectionKey,
      quantity: nextQuantity,
      title: input.title || previousItem.title,
      slug: input.slug || previousItem.slug,
      imageUrl: input.imageUrl ?? previousItem.imageUrl,
      unitPriceAmount,
      lineTotalAmount: unitPriceAmount * nextQuantity,
      unitPriceFormatted:
        input.unitPriceFormatted?.trim() ||
        formatMoneyAmount(unitPriceAmount, input.currency, input.locale),
      lineTotalFormatted: formatMoneyAmount(
        unitPriceAmount * nextQuantity,
        input.currency,
        input.locale,
      ),
      modifierLines:
        input.modifierLines.length > 0
          ? input.modifierLines
          : previousItem.modifierLines,
    };
    const items = current.items.map((item, index) =>
      index === existingIndex ? nextItem : item,
    );
    setView(recalculateLocalCartView({ ...baseView, items }));
    return {
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
    unitPriceAmount,
    lineTotalAmount: unitPriceAmount * quantity,
    unitPriceFormatted:
      input.unitPriceFormatted?.trim() ||
      formatMoneyAmount(unitPriceAmount, input.currency, input.locale),
    lineTotalFormatted: formatMoneyAmount(
      unitPriceAmount * quantity,
      input.currency,
      input.locale,
    ),
    modifierLines: input.modifierLines,
  };
  const items = [...current.items, nextItem];
  setView(recalculateLocalCartView({ ...baseView, items }));
  return {
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
    setView(recalculateLocalCartView({ ...current, items }));
    return;
  }

  const restoredQty = Math.max(
    0,
    current.items[index]!.quantity - result.quantityDelta,
  );
  if (restoredQty < 1) {
    const items = current.items.filter((_, i) => i !== index);
    setView(recalculateLocalCartView({ ...current, items }));
    return;
  }

  const restored: CartDrawerItemView = {
    ...result.previousItem,
    quantity: restoredQty,
    unitPriceAmount: result.previousItem.unitPriceAmount,
    lineTotalAmount:
      safeMoneyInteger(result.previousItem.unitPriceAmount ?? 0) *
      restoredQty,
  };
  const items = current.items.map((item, i) =>
    i === index ? restored : item,
  );
  setView(recalculateLocalCartView({ ...current, items }));
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
  setView(recalculateLocalCartView({ ...current, items }));
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
  const unitPriceAmount = safeMoneyInteger(previous.unitPriceAmount ?? 0);
  const items = current.items.map((row) =>
    row.id === itemId
      ? {
          ...row,
          quantity,
          unitPriceAmount,
          lineTotalAmount: unitPriceAmount * quantity,
        }
      : row,
  );
  setView(recalculateLocalCartView({ ...current, items }));
  return { previous, nextQuantity: quantity };
}

export function restoreItemLocallyShared(item: CartDrawerItemView): void {
  const current = view;
  if (!current) {
    // Without an existing view we cannot know locale/currency; skip until reload.
    return;
  }
  if (current.items.some((row) => row.id === item.id)) {
    const items = current.items.map((row) =>
      row.id === item.id ? item : row,
    );
    setView(recalculateLocalCartView({ ...current, items }));
    return;
  }
  setView(
    recalculateLocalCartView({
      ...current,
      items: [...current.items, item],
    }),
  );
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
