"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IdramAutoSubmitForm } from "@/features/checkout/ui/IdramAutoSubmitForm";
import { retryIdramPaymentAction } from "@/features/payments/providers/idram/actions";
import type { Locale } from "@/lib/i18n/config";

type IdramPaymentActionsProps = {
  locale: Locale;
  orderId: string;
  orderNumber: string;
  labels: {
    retryPayment: string;
    retrying: string;
    providerUnavailable: string;
    redirecting: string;
    submitFallback: string;
    refreshStatus: string;
  };
};

export function IdramPaymentActions({
  locale,
  orderId,
  orderNumber,
  labels,
}: IdramPaymentActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    action: string;
    fields: Record<string, string>;
  } | null>(null);

  if (form) {
    return (
      <IdramAutoSubmitForm
        action={form.action}
        fields={form.fields}
        redirectingLabel={labels.redirecting}
        submitFallbackLabel={labels.submitFallback}
      />
    );
  }

  const onRefresh = () => {
    router.replace(`/${locale}/checkout/success/${orderNumber}`);
    router.refresh();
  };

  const onRetry = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryIdramPaymentAction({
        orderId,
        locale,
      });
      if (!result.ok) {
        setError(result.error || labels.providerUnavailable);
        return;
      }
      setForm({
        action: result.action,
        fields: result.fields,
      });
    });
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={onRefresh}
        className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {labels.refreshStatus}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onRetry}
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red-hot disabled:opacity-60"
      >
        {pending ? labels.retrying : labels.retryPayment}
      </button>
      {error ? (
        <p role="alert" className="text-center text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
