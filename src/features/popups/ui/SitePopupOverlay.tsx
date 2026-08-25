"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  APP_MODAL_BACKDROP_IN_CLASS,
  APP_MODAL_BACKDROP_OUT_CLASS,
  APP_MODAL_EXIT_FALLBACK_MS,
  APP_MODAL_PANEL_IN_CLASS,
  APP_MODAL_PANEL_OUT_ANIMATION_NAME,
  APP_MODAL_PANEL_OUT_CLASS,
  APP_MODAL_Z_INDEX,
} from "@/components/modal/confirm-modal-motion";
import { useAnimatedModalDismiss } from "@/lib/ui/useAnimatedModalDismiss";

type SitePopupOverlayProps = {
  imageUrl: string;
  closeLabel: string;
};

/** Settle time after the page finishes loading before the popup opens. */
const POPUP_OPEN_AFTER_LOAD_MS = 600;

/**
 * Full-image storefront popup. Opens once the document has finished loading
 * so it never competes with the initial page render; dismissible via close,
 * backdrop, or Escape. No cookie/localStorage persistence.
 */
export function SitePopupOverlay({
  imageUrl,
  closeLabel,
}: SitePopupOverlayProps) {
  const [open, setOpen] = useState(false);
  const {
    isVisible,
    isExiting,
    handlePanelAnimationEnd,
    backdropMotionClass,
    panelMotionClass,
  } = useAnimatedModalDismiss({
    isOpen: open,
    panelOutAnimationName: APP_MODAL_PANEL_OUT_ANIMATION_NAME,
    exitFallbackMs: APP_MODAL_EXIT_FALLBACK_MS,
    backdropInClass: APP_MODAL_BACKDROP_IN_CLASS,
    backdropOutClass: APP_MODAL_BACKDROP_OUT_CLASS,
    panelInClass: APP_MODAL_PANEL_IN_CLASS,
    panelOutClass: APP_MODAL_PANEL_OUT_CLASS,
  });

  useEffect(() => {
    let openTimer = 0;

    function scheduleOpen(): void {
      openTimer = window.setTimeout(
        () => setOpen(true),
        POPUP_OPEN_AFTER_LOAD_MS,
      );
    }

    if (document.readyState === "complete") {
      scheduleOpen();
      return () => window.clearTimeout(openTimer);
    }

    window.addEventListener("load", scheduleOpen);
    return () => {
      window.removeEventListener("load", scheduleOpen);
      window.clearTimeout(openTimer);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || isExiting) return;

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, isExiting]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: APP_MODAL_Z_INDEX }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        className={`absolute inset-0 cursor-default rounded-none bg-black/60 ${backdropMotionClass}`}
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={closeLabel}
        className={`relative max-h-[90dvh] max-w-[min(100%,36rem)] ${panelMotionClass}`}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-2 text-gray-700 shadow-md transition hover:bg-gray-100"
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
          className="max-h-[90dvh] w-full rounded-[20px] object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
