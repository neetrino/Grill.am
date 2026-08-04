"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type SitePopupOverlayProps = {
  imageUrl: string;
  closeLabel: string;
};

/**
 * Full-image storefront popup. Opens on every document visit (layout mount);
 * dismissible via close or backdrop. No cookie/localStorage persistence.
 */
export function SitePopupOverlay({
  imageUrl,
  closeLabel,
}: SitePopupOverlayProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={closeLabel}
      onClick={() => setOpen(false)}
    >
      <div
        className="relative max-h-[90dvh] max-w-[min(100%,36rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-2 text-gray-700 shadow-md hover:bg-gray-100"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- full CMS image popup */}
        <img
          src={imageUrl}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="max-h-[90dvh] w-full rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
