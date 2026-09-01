"use client";

import { useEffect, useState } from "react";

import { Toast } from "@/components/ui/Toast";
import { subscribeCartMinOrderBlocked } from "@/features/cart/cart-min-order-alert";

type CartMinOrderAlertHostProps = {
  /** Template with `{count}` placeholder. */
  messageTemplate: string;
  closeLabel: string;
};

/** Storefront toast for per-product minimum order quantity blocks. */
export function CartMinOrderAlertHost({
  messageTemplate,
  closeLabel,
}: CartMinOrderAlertHostProps) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  useEffect(() => {
    return subscribeCartMinOrderBlocked((minQty) => {
      setToast({
        id: Date.now(),
        message: messageTemplate.replace("{count}", String(minQty)),
      });
    });
  }, [messageTemplate]);

  if (!toast) {
    return null;
  }

  return (
    <Toast
      key={toast.id}
      message={toast.message}
      tone="error"
      closeLabel={closeLabel}
      onDismiss={() => setToast(null)}
    />
  );
}
