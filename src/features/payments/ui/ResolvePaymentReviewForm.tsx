"use client";

import { useState, useTransition } from "react";

import { resolvePaymentReviewAction } from "@/features/payments/application/resolve-payment-review";

type ResolvePaymentReviewFormProps = {
  locale: string;
  orderNumber: string;
};

export function ResolvePaymentReviewForm({
  locale,
  orderNumber,
}: ResolvePaymentReviewFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await resolvePaymentReviewAction(locale, {
            orderNumber,
            resolutionType: String(data.get("resolutionType")),
            toStatus: String(data.get("toStatus")),
            note: String(data.get("note") ?? "") || undefined,
          });
          if (!result.ok) {
            setError(result.error.message);
            return;
          }
          setMessage(
            `Resolved to ${result.value.toStatus} (${result.value.resolutionType}).`,
          );
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Resolution</span>
          <select
            name="resolutionType"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
            disabled={pending}
          >
            <option value="allocate_stock">Allocate stock manually</option>
            <option value="confirm_delayed_fulfillment">
              Confirm delayed fulfillment
            </option>
            <option value="cancel_fulfillment_external_refund">
              Cancel fulfillment (external refund)
            </option>
            <option value="mark_resolved_after_external_refund">
              Mark resolved after external refund
            </option>
            <option value="escalate_finance">Escalate to finance/support</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Next fulfillment status</span>
          <select
            name="toStatus"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
            disabled={pending}
            defaultValue="PROCESSING"
          >
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Operator note</span>
        <textarea
          name="note"
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={pending}
          maxLength={2000}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Resolve review"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
