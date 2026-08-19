"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyPromoCodeButtonProps = {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
  onCopied?: () => void;
};

type CopyPromoCodeTextProps = {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  onCopied?: () => void;
};

function useCopyPromoCode(
  code: string,
  onCopied?: () => void,
): {
  copied: boolean;
  copy: () => void;
} {
  const [copied, setCopied] = useState(false);

  function copy(): void {
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        onCopied?.();
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setCopied(false);
      },
    );
  }

  return { copied, copy };
}

export function CopyPromoCodeButton({
  code,
  copyLabel,
  copiedLabel,
  className = "rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
  onCopied,
}: CopyPromoCodeButtonProps) {
  const { copied, copy } = useCopyPromoCode(code, onCopied);

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
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

/** Clickable promo code that copies the value to the clipboard. */
export function CopyPromoCodeText({
  code,
  copyLabel,
  copiedLabel,
  onCopied,
}: CopyPromoCodeTextProps) {
  const { copied, copy } = useCopyPromoCode(code, onCopied);

  return (
    <button
      type="button"
      onClick={copy}
      className="font-medium text-gray-900 hover:underline"
      aria-label={copied ? copiedLabel : copyLabel}
    >
      {code}
    </button>
  );
}
