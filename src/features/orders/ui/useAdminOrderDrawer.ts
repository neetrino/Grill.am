"use client";

import { useRef, useState, useTransition } from "react";

import { getAdminOrderDetailAction } from "@/features/orders/application/get-order-detail";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";

type UseAdminOrderDrawerResult = {
  open: boolean;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  openOrder: (orderNumber: string) => void;
  refreshOpenOrder: () => void;
  closeDrawer: () => void;
};

/**
 * Loads an admin order into `OrderDetailsDrawer` (list, dashboard, user page).
 */
export function useAdminOrderDrawer(locale: string): UseAdminOrderDrawerResult {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openNumberRef = useRef<string | null>(null);

  function loadOrder(orderNumber: string, reset: boolean): void {
    openNumberRef.current = orderNumber;
    setOpen(true);
    if (reset) {
      setDetail(null);
      setError(null);
    }

    startTransition(async () => {
      const result = await getAdminOrderDetailAction(locale, orderNumber);
      if (openNumberRef.current !== orderNumber) {
        return;
      }
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setError(null);
      setDetail(result.value);
    });
  }

  function openOrder(orderNumber: string): void {
    loadOrder(orderNumber, true);
  }

  function refreshOpenOrder(): void {
    const orderNumber = openNumberRef.current;
    if (!orderNumber) {
      return;
    }
    loadOrder(orderNumber, false);
  }

  function closeDrawer(): void {
    openNumberRef.current = null;
    setOpen(false);
    setDetail(null);
    setError(null);
  }

  return {
    open,
    detail,
    error,
    isLoading: isPending && detail === null,
    openOrder,
    refreshOpenOrder,
    closeDrawer,
  };
}
