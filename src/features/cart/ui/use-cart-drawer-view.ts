"use client";

import { useEffect } from "react";

import {
  getCartSyncVersion,
  useCartSyncVersion,
} from "@/features/cart/cart-client-sync";
import {
  replaceCartDrawerViewFromServer,
  useCartDrawerLocalView,
} from "@/features/cart/cart-drawer-local-store";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type UseCartDrawerViewResult = {
  view: CartDrawerView | null;
  /** True when `view` matches the latest cart revision. */
  viewIsCurrent: boolean;
  loading: boolean;
  cartVersion: number;
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

    void loadCartDrawerViewShared(
      locale,
      currency,
      requestedVersion,
      serverItemCount,
    ).then((next) => {
      if (cancelled) return;
      if (getCartSyncVersion() !== requestedVersion) return;
      replaceCartDrawerViewFromServer(next, requestedVersion);
    });

    return () => {
      cancelled = true;
    };
  }, [cartVersion, serverItemCount, locale, currency]);

  return {
    view,
    viewIsCurrent: view != null,
    loading: view == null,
    cartVersion,
  };
}
