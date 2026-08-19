"use client";

import { useState, useTransition } from "react";

import { getAdminOrderDetailAction } from "@/features/orders/application/get-order-detail";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";

type UseAdminOrderDrawerResult = {
  open: boolean;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  openOrder: (orderNumber: string) => void;
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

  function openOrder(orderNumber: string): void {
    setOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getAdminOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  function closeDrawer(): void {
    setOpen(false);
    setDetail(null);
    setError(null);
  }

  return {
    open,
    detail,
    error,
    isLoading: isPending,
    openOrder,
    closeDrawer,
  };
}
