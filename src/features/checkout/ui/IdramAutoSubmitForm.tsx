"use client";

import { useEffect, useRef } from "react";

type IdramAutoSubmitFormProps = {
  action: string;
  fields: Record<string, string>;
  redirectingLabel: string;
  submitFallbackLabel: string;
};

/**
 * Auto-submits the official iDram GetPayment POST form (Merchant API §2).
 * Never includes SECRET_KEY — fields come only from the server.
 */
export function IdramAutoSubmitForm({
  action,
  fields,
  redirectingLabel,
  submitFallbackLabel,
}: IdramAutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-sm text-gray-700">{redirectingLabel}</p>
      <form ref={formRef} action={action} method="POST" acceptCharset="UTF-8">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <noscript>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-semibold text-white"
          >
            {submitFallbackLabel}
          </button>
        </noscript>
        <button
          type="submit"
          className="mt-2 text-sm font-medium text-brand-red underline"
        >
          {submitFallbackLabel}
        </button>
      </form>
    </div>
  );
}
