"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  recheckArcaPaymentAction,
  retryArcaPaymentAction,
} from "@/features/payments/providers/arca/actions";
import type { Locale } from "@/lib/i18n/config";

type ArcaPaymentActionsProps = {
  locale: Locale;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  mode: "recheck" | "retry" | "both";
  labels: {
    recheckPayment: string;
    rechecking: string;
    retryPayment: string;
    retrying: string;
    verificationUnavailable: string;
    providerUnavailable: string;
  };
};

export function ArcaPaymentActions({
  locale,
  orderId,
  orderNumber,
  paymentId,
  mode,
  labels,
}: ArcaPaymentActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const successPath = `/${locale}/checkout/success/${orderNumber}`;

  const onRecheck = () => {
    setError(null);
    startTransition(async () => {
      const result = await recheckArcaPaymentAction({
        orderId,
        paymentId,
        locale,
      });
      if (!result.ok) {
        setError(result.error || labels.verificationUnavailable);
        return;
      }
      if (result.state === "captured") {
        router.replace(successPath);
      } else {
        router.replace(`${successPath}?state=${result.state}`);
      }
      router.refresh();
    });
  };

  const onRetry = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryArcaPaymentAction({
        orderId,
        locale,
      });
      if (!result.ok) {
        setError(result.error || labels.providerUnavailable);
        return;
      }
      if (result.type === "redirect") {
        window.location.assign(result.redirectUrl);
        return;
      }
      if (result.type === "already_captured") {
        router.replace(successPath);
        router.refresh();
        return;
      }
      router.replace(`${successPath}?state=pending`);
      router.refresh();
    });
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      {(mode === "recheck" || mode === "both") && (
        <button
          type="button"
          disabled={pending}
          onClick={onRecheck}
          className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? labels.rechecking : labels.recheckPayment}
        </button>
      )}
      {(mode === "retry" || mode === "both") && (
        <button
          type="button"
          disabled={pending}
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red-hot disabled:opacity-60"
        >
          {pending ? labels.retrying : labels.retryPayment}
        </button>
      )}
      {error ? (
        <p role="alert" className="text-center text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
