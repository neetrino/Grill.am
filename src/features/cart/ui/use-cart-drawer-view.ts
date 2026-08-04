"use client";

import { useEffect, useState } from "react";

import {
  getCartSyncVersion,
  useCartSyncVersion,
} from "@/features/cart/cart-client-sync";
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
  const [viewEpoch, setViewEpoch] = useState<{
    version: number;
    serverItemCount: number;
  } | null>(null);

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

  const viewIsCurrent =
    view != null &&
    viewEpoch != null &&
    viewEpoch.version === cartVersion &&
    viewEpoch.serverItemCount === serverItemCount;

  return {
    view,
    viewIsCurrent,
    loading: !viewIsCurrent,
    cartVersion,
  };
}
