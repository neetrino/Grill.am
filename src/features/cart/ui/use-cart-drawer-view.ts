"use client";

import { useEffect, useRef, useState } from "react";

import {
  getCartSyncVersion,
  reconcileLocalCartItemCount,
  useCartSyncVersion,
} from "@/features/cart/cart-client-sync";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type UseCartDrawerViewResult = {
  view: CartDrawerView | null;
  /** True when `view` matches the latest cart revision. */
  viewIsCurrent: boolean;
  loading: boolean;
  cartVersion: number;
  /** Instantly remove a line from the local list (before DB). */
  removeItemLocally: (itemId: string) => CartDrawerItemView | null;
  /** Instantly set line quantity in the local list (before DB). */
  setQuantityLocally: (
    itemId: string,
    quantity: number,
  ) => { previous: CartDrawerItemView; nextQuantity: number } | null;
  /** Restore a line after a failed optimistic remove/qty change. */
  restoreItemLocally: (item: CartDrawerItemView) => void;
};

const inflightLoads = new Map<string, Promise<CartDrawerView>>();

function loadCartDrawerViewShared(
  locale: Locale,
  currency: Currency,
  version: number,
  serverItemCount: number,
): Promise<CartDrawerView> {
  const key = `${version}:${serverItemCount}:${locale}:${currency}`;
  const existing = inflightLoads.get(key);
  if (existing) {
    return existing;
  }

  const request = loadCartDrawerViewAction(locale, currency).finally(() => {
    inflightLoads.delete(key);
  });
  inflightLoads.set(key, request);
  return request;
}

function recomputeItemCount(items: CartDrawerItemView[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Loads cart drawer payload and reloads when durable cart contents change
 * (client notify) or when the server-provided item count changes (RSC refresh).
 */
export function useCartDrawerView(
  locale: Locale,
  currency: Currency,
  serverItemCount = 0,
): UseCartDrawerViewResult {
  const cartVersion = useCartSyncVersion();
  const [view, setView] = useState<CartDrawerView | null>(null);
  const viewRef = useRef<CartDrawerView | null>(null);
  const [viewEpoch, setViewEpoch] = useState<{
    version: number;
    serverItemCount: number;
  } | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    const requestedVersion = cartVersion;
    const requestedCount = serverItemCount;

    void loadCartDrawerViewShared(
      locale,
      currency,
      requestedVersion,
      requestedCount,
    ).then((next) => {
      if (cancelled) return;
      if (getCartSyncVersion() !== requestedVersion) return;
      reconcileLocalCartItemCount(next.itemCount);
      setView(next);
      setViewEpoch({
        version: requestedVersion,
        serverItemCount: requestedCount,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cartVersion, serverItemCount, locale, currency]);

  function removeItemLocally(itemId: string): CartDrawerItemView | null {
    const current = viewRef.current;
    if (!current) {
      return null;
    }
    const item = current.items.find((row) => row.id === itemId);
    if (!item) {
      return null;
    }
    const items = current.items.filter((row) => row.id !== itemId);
    const next: CartDrawerView = {
      ...current,
      items,
      itemCount: recomputeItemCount(items),
    };
    viewRef.current = next;
    setView(next);
    return item;
  }

  function setQuantityLocally(
    itemId: string,
    quantity: number,
  ): { previous: CartDrawerItemView; nextQuantity: number } | null {
    if (quantity < 1) {
      const removed = removeItemLocally(itemId);
      if (!removed) {
        return null;
      }
      return { previous: removed, nextQuantity: 0 };
    }

    const current = viewRef.current;
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
    const next: CartDrawerView = {
      ...current,
      items,
      itemCount: recomputeItemCount(items),
    };
    viewRef.current = next;
    setView(next);
    return { previous, nextQuantity: quantity };
  }

  function restoreItemLocally(item: CartDrawerItemView): void {
    const current = viewRef.current;
    let next: CartDrawerView;
    if (!current) {
      next = {
        itemCount: item.quantity,
        items: [item],
        subtotalFormatted: "…",
        shippingFormatted: "…",
        totalFormatted: "…",
      };
    } else if (current.items.some((row) => row.id === item.id)) {
      const items = current.items.map((row) =>
        row.id === item.id ? item : row,
      );
      next = {
        ...current,
        items,
        itemCount: recomputeItemCount(items),
      };
    } else {
      const items = [...current.items, item];
      next = {
        ...current,
        items,
        itemCount: recomputeItemCount(items),
      };
    }
    viewRef.current = next;
    setView(next);
  }

  const viewIsCurrent =
    view != null &&
    viewEpoch != null &&
    viewEpoch.version === cartVersion &&
    viewEpoch.serverItemCount === serverItemCount;

  return {
    view,
    viewIsCurrent,
    /** Only for first paint — not after optimistic edits / background refresh. */
    loading: view == null,
    cartVersion,
    removeItemLocally,
    setQuantityLocally,
    restoreItemLocally,
  };
}
