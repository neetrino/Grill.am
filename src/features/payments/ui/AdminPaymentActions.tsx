"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { recheckArcaPaymentAction } from "@/features/payments/providers/arca/actions";
import { expirePaymentAttemptAction } from "@/features/payments/application/admin-payment-actions";
import { refundArcaPaymentAction } from "@/features/payments/application/refund-arca-payment-action";

type AdminPaymentActionsProps = {
  locale: string;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  supportReference: string;
};

export function AdminPaymentActions({
  locale,
  orderId,
  orderNumber,
  paymentId,
  provider,
  status,
  amount,
  currency,
  supportReference,
}: AdminPaymentActionsProps) {
  const router = useRouter();
  const { confirmDelete } = useConfirmDelete();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const canRecheckArca =
    provider === "arca" && (status === "PENDING" || status === "AUTHORIZED");
  const canExpire =
    (status === "PENDING" || status === "AUTHORIZED") &&
    provider !== "cod";
  const canRefund = provider === "arca" && status === "CAPTURED";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="text-left text-xs font-medium text-brand-red underline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(supportReference);
            setMessage("Copied");
          } catch {
            setMessage(supportReference);
          }
        }}
      >
        Copy ref
      </button>
      {canRecheckArca ? (
        <button
          type="button"
          disabled={pending}
          className="text-left text-xs font-medium text-gray-800 underline disabled:opacity-50"
          onClick={() => {
            startTransition(async () => {
              const result = await recheckArcaPaymentAction({
                orderId,
                paymentId,
                locale,
              });
              setMessage(result.ok ? `State: ${result.state}` : result.error);
              router.refresh();
            });
          }}
        >
          Verify ARCA
        </button>
      ) : null}
      {canExpire ? (
        <button
          type="button"
          disabled={pending}
          className="text-left text-xs font-medium text-gray-800 underline disabled:opacity-50"
          onClick={() => {
            startTransition(async () => {
              const result = await expirePaymentAttemptAction({
                paymentId,
                locale,
              });
              setMessage(
                result.ok ? result.message : result.error ?? "Failed",
              );
              router.refresh();
            });
          }}
        >
          Mark expired
        </button>
      ) : null}
      {canRefund ? (
        <button
          type="button"
          disabled={pending}
          className="text-left text-xs font-medium text-brand-red underline disabled:opacity-50"
          onClick={() => {
            void (async () => {
              const accepted = await confirmDelete({
                title: "Refund payment",
                message: `Return the full amount (${amount.toLocaleString("en-US")} ${currency}) through the bank? The order status will not change.`,
                confirmText: "Refund",
                cancelText: "Cancel",
                confirmTone: "danger",
              });
              if (!accepted) return;
              startTransition(async () => {
                const result = await refundArcaPaymentAction({
                  paymentId,
                  locale,
                });
                setMessage(result.ok ? result.message : result.error);
                router.refresh();
              });
            })();
          }}
        >
          Refund
        </button>
      ) : null}
      {message ? (
        <span className="text-[11px] text-gray-500">{message}</span>
      ) : null}
      <span className="sr-only">{orderNumber}</span>
    </div>
  );
}
