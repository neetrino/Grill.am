"use client";

import { useSyncExternalStore } from "react";

import {
  emptyCartDrawerView,
  recalculateLocalCartView,
  safeMoneyInteger,
} from "@/features/cart/cart-drawer-money";
import {
  cartLineMatchKey,
  optimisticCartLineId,
} from "@/features/cart/cart-line-key";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { setLocalCartItemCount } from "@/features/cart/cart-client-sync";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

export type { CartLineIdentity } from "@/features/cart/cart-line-key";
export { cartLineMatchKey, optimisticCartLineId, recalculateLocalCartView };

type Listener = () => void;

export type OptimisticCartLineInput = {
  productId: string;
  selectionKey: string;
  title: string;
  slug: string;
  quantity: number;
  imageUrl: string | null;
  unitPriceAmount: number;
  locale: Locale;
  currency: Currency;
  unitPriceFormatted?: string;
  modifierLines: string[];
};

export type PendingCartLineMutation = {
  productId: string;
  selectionKey: string;
  desiredQuantity: number;
  acknowledgedQuantity: number;
  revision: number;
  acknowledgedRevision: number;
  display?: OptimisticCartLineInput;
};

let lastServerView: CartDrawerView | null = null;
let displayView: CartDrawerView | null = null;
let appliedServerRevision = -1;
const pendingByKey = new Map<string, PendingCartLineMutation>();
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function itemMatchKey(item: CartDrawerItemView): string {
  return cartLineMatchKey(item.productId, item.selectionKey);
}

function findServerItem(
  productId: string,
  selectionKey: string,
): CartDrawerItemView | undefined {
  const key = cartLineMatchKey(productId, selectionKey);
  return lastServerView?.items.find((item) => itemMatchKey(item) === key);
}

function isPendingEchoed(
  pending: PendingCartLineMutation,
  serverItem: CartDrawerItemView | undefined,
): boolean {
  if (pending.revision !== pending.acknowledgedRevision) {
    return false;
  }
  if (pending.desiredQuantity !== pending.acknowledgedQuantity) {
    return false;
  }
  if (pending.desiredQuantity <= 0) {
    return lastServerView != null && serverItem == null;
  }
  return serverItem != null && serverItem.quantity === pending.desiredQuantity;
}

function itemFromDisplay(
  pending: PendingCartLineMutation,
): CartDrawerItemView | null {
  const display = pending.display;
  if (!display || pending.desiredQuantity <= 0) {
    return null;
  }
  const unitPriceAmount = safeMoneyInteger(display.unitPriceAmount);
  return {
    id: optimisticCartLineId(pending.productId, pending.selectionKey),
    productId: pending.productId,
    selectionKey: pending.selectionKey,
    title: display.title,
    slug: display.slug,
    quantity: pending.desiredQuantity,
    imageUrl: display.imageUrl,
    unitPriceAmount,
    lineTotalAmount: unitPriceAmount * pending.desiredQuantity,
    unitPriceFormatted:
      display.unitPriceFormatted?.trim() ||
      formatMoneyAmount(unitPriceAmount, display.currency, display.locale),
    lineTotalFormatted: formatMoneyAmount(
      unitPriceAmount * pending.desiredQuantity,
      display.currency,
      display.locale,
    ),
    modifierLines: display.modifierLines,
  };
}

function mergeDisplayItems(base: CartDrawerView): CartDrawerItemView[] {
  const usedKeys = new Set<string>();
  const items: CartDrawerItemView[] = [];

  for (const serverItem of base.items) {
    const key = itemMatchKey(serverItem);
    const pending = pendingByKey.get(key);
    usedKeys.add(key);
    if (!pending) {
      items.push(serverItem);
      continue;
    }
    if (isPendingEchoed(pending, serverItem)) {
      pendingByKey.delete(key);
      items.push(serverItem);
      continue;
    }
    if (pending.desiredQuantity <= 0) {
      continue;
    }
    items.push({ ...serverItem, quantity: pending.desiredQuantity });
  }

  for (const [key, pending] of pendingByKey) {
    if (usedKeys.has(key) || pending.desiredQuantity <= 0) {
      if (!usedKeys.has(key) && isPendingEchoed(pending, undefined)) {
        pendingByKey.delete(key);
      }
      continue;
    }
    const optimistic = itemFromDisplay(pending);
    if (optimistic) {
      items.push(optimistic);
    }
  }

  return items;
}

function rebuildDisplayView(): void {
  const base =
    lastServerView ??
    (displayView
      ? emptyCartDrawerView(displayView.locale, displayView.currency)
      : null);

  if (!base) {
    const pendingWithDisplay = [...pendingByKey.values()].find(
      (line) => line.display && line.desiredQuantity > 0,
    );
    if (!pendingWithDisplay?.display) {
      displayView = null;
      setLocalCartItemCount(0);
      emit();
      return;
    }
    const seed = emptyCartDrawerView(
      pendingWithDisplay.display.locale,
      pendingWithDisplay.display.currency,
    );
    displayView = recalculateLocalCartView({
      ...seed,
      items: mergeDisplayItems(seed),
    });
    setLocalCartItemCount(displayView.itemCount);
    emit();
    return;
  }

  displayView = recalculateLocalCartView({
    ...base,
    items: mergeDisplayItems(base),
  });
  setLocalCartItemCount(displayView.itemCount);
  emit();
}

export function subscribeCartDrawerLocal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartDrawerLocalView(): CartDrawerView | null {
  return displayView;
}

export function getPendingCartLine(
  productId: string,
  selectionKey: string,
): PendingCartLineMutation | undefined {
  return pendingByKey.get(cartLineMatchKey(productId, selectionKey));
}

export function getDisplayedCartLineQuantity(
  productId: string,
  selectionKey: string,
): number {
  const pending = getPendingCartLine(productId, selectionKey);
  if (pending) {
    return Math.max(0, pending.desiredQuantity);
  }
  return findServerItem(productId, selectionKey)?.quantity ?? 0;
}

/** Replaces last server snapshot; unacknowledged desired quantities stay visible. */
export function replaceCartDrawerViewFromServer(
  serverView: CartDrawerView,
  revision?: number,
): void {
  if (revision != null && revision < appliedServerRevision) {
    return;
  }
  if (revision != null) {
    appliedServerRevision = revision;
  }
  lastServerView = serverView;
  rebuildDisplayView();
}

export function applyDesiredCartLine(input: {
  productId: string;
  selectionKey: string;
  desiredQuantity: number;
  display?: OptimisticCartLineInput;
}): PendingCartLineMutation {
  const key = cartLineMatchKey(input.productId, input.selectionKey);
  const existing = pendingByKey.get(key);
  const serverQty = findServerItem(input.productId, input.selectionKey)
    ?.quantity ?? 0;
  const next: PendingCartLineMutation = {
    productId: input.productId,
    selectionKey: input.selectionKey,
    desiredQuantity: Math.max(0, Math.floor(input.desiredQuantity)),
    acknowledgedQuantity: existing?.acknowledgedQuantity ?? serverQty,
    revision: (existing?.revision ?? 0) + 1,
    acknowledgedRevision: existing?.acknowledgedRevision ?? 0,
    display: input.display ?? existing?.display,
  };
  pendingByKey.set(key, next);
  rebuildDisplayView();
  return next;
}

export function acknowledgeCartLineQuantity(
  productId: string,
  selectionKey: string,
  quantity: number,
  sentRevision?: number,
): void {
  const key = cartLineMatchKey(productId, selectionKey);
  const existing = pendingByKey.get(key);
  if (!existing) {
    return;
  }
  existing.acknowledgedQuantity = Math.max(0, Math.floor(quantity));
  existing.acknowledgedRevision = sentRevision ?? existing.revision;
  rebuildDisplayView();
}

export function rollbackCartLineToAcknowledged(
  productId: string,
  selectionKey: string,
): void {
  const key = cartLineMatchKey(productId, selectionKey);
  const existing = pendingByKey.get(key);
  if (!existing) {
    return;
  }
  existing.desiredQuantity = existing.acknowledgedQuantity;
  rebuildDisplayView();
}

export function useCartDrawerLocalView(): CartDrawerView | null {
  return useSyncExternalStore(
    subscribeCartDrawerLocal,
    getCartDrawerLocalView,
    () => null,
  );
}

export function resetCartDrawerLocalStoreForTests(): void {
  lastServerView = null;
  displayView = null;
  appliedServerRevision = -1;
  pendingByKey.clear();
  emit();
}
