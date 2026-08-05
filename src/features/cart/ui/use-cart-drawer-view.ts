"use client";

import { useEffect } from "react";

import {
  getCartSyncVersion,
  reconcileLocalCartItemCount,
  useCartSyncVersion,
} from "@/features/cart/cart-client-sync";
import {
  removeItemLocallyShared,
  replaceCartDrawerViewFromServer,
  restoreItemLocallyShared,
  setQuantityLocallyShared,
  useCartDrawerLocalView,
  upsertItemLocally,
  type OptimisticCartLineInput,
  type UpsertItemLocallyResult,
} from "@/features/cart/cart-drawer-local-store";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type { OptimisticCartLineInput, UpsertItemLocallyResult };

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
  /** Instantly upsert a line (shared; usable from add-to-cart actions). */
  upsertItemLocally: (
    input: OptimisticCartLineInput,
  ) => UpsertItemLocallyResult;
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

/**
 * Loads cart drawer payload into the shared local store and reloads when
 * durable cart contents change (client notify) or server item count changes.
 */
export function useCartDrawerView(
  locale: Locale,
  currency: Currency,
  serverItemCount = 0,
): UseCartDrawerViewResult {
  const cartVersion = useCartSyncVersion();
  const view = useCartDrawerLocalView();

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
      replaceCartDrawerViewFromServer(next);
    });

    return () => {
      cancelled = true;
    };
  }, [cartVersion, serverItemCount, locale, currency]);

  const viewIsCurrent = view != null;

  return {
    view,
    viewIsCurrent,
    /** Only for first paint — not after optimistic edits / background refresh. */
    loading: view == null,
    cartVersion,
    removeItemLocally: removeItemLocallyShared,
    setQuantityLocally: setQuantityLocallyShared,
    restoreItemLocally: restoreItemLocallyShared,
    upsertItemLocally,
  };
}
