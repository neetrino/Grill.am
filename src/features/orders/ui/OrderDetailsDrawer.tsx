"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { OrderDetailsDrawerCustomizations } from "@/features/orders/ui/OrderDetailsDrawerCustomizations";
import { OrderDetailsDrawerItems } from "@/features/orders/ui/OrderDetailsDrawerItems";
import { OrderDetailsDrawerShipping } from "@/features/orders/ui/OrderDetailsDrawerShipping";
import { OrderDetailsDrawerSummary } from "@/features/orders/ui/OrderDetailsDrawerSummary";
import { OrderDetailsDrawerTotals } from "@/features/orders/ui/OrderDetailsDrawerTotals";

type OrderDetailsDrawerReorder = {
  label: string;
  pendingLabel: string;
  onReorder: () => void;
  isPending: boolean;
  error: string | null;
};

type OrderDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  /** Customer-only reorder control in the drawer header. */
  reorder?: OrderDetailsDrawerReorder;
};

export function OrderDetailsDrawer({
  open,
  onClose,
  detail,
  error,
  isLoading,
  reorder,
}: OrderDetailsDrawerProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const common = dictionary.common;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={drawer.title}
      onClick={onClose}
    >
      <div
        className="flex h-full w-[70%] flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-900">
              {drawer.title}
            </h2>
            {detail ? (
              <p className="mt-1 text-sm text-gray-500">#{detail.orderNumber}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {reorder && detail && !isLoading && !error ? (
              <Button
                type="button"
                size="sm"
                onClick={reorder.onReorder}
                disabled={reorder.isPending}
              >
                {reorder.isPending ? reorder.pendingLabel : reorder.label}
              </Button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label={common.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {reorder?.error ? (
          <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
            {reorder.error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="px-6 py-8 text-sm text-gray-600">{drawer.loading}</p>
          ) : null}
          {error ? (
            <p className="px-6 py-8 text-sm text-red-700">{error}</p>
          ) : null}
          {!isLoading && !error && detail ? (
            <>
              <OrderDetailsDrawerSummary detail={detail} />
              <OrderDetailsDrawerShipping detail={detail} />
              <OrderDetailsDrawerTotals detail={detail} />
              <OrderDetailsDrawerItems detail={detail} />
              <OrderDetailsDrawerCustomizations detail={detail} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
