"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyPromoCodeButtonProps = {
  code: string;
  copyLabel: string;
  copiedLabel: string;
};

export function CopyPromoCodeButton({
  code,
  copyLabel,
  copiedLabel,
}: CopyPromoCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label={copied ? copiedLabel : copyLabel}
    >
      {copied ? (
        <Check className="h-4 w-4 text-brand-red" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
