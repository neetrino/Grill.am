"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Time the toast stays fully visible before it starts fading out. */
const TOAST_VISIBLE_MS = 3200;
/** Must match `.animate-toast-out` duration in globals.css. */
const TOAST_EXIT_MS = 280;

export const TOAST_Z_INDEX = 300;

export type ToastTone = "success" | "error";

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-green-200 bg-white text-green-800",
  error: "border-red-200 bg-white text-red-800",
};

const TONE_ICON_CLASS: Record<ToastTone, string> = {
  success: "text-green-600",
  error: "text-brand-red",
};

type ToastProps = {
  message: string;
  tone: ToastTone;
  /** Called after the exit animation finishes so the parent can drop state. */
  onDismiss: () => void;
  closeLabel: string;
};

/**
 * Top-centered notification that fades in, auto-hides, and fades out.
 * Render with a changing `key` so repeated messages restart the timer.
 */
export function Toast({ message, tone, onDismiss, closeLabel }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const hideTimer = window.setTimeout(
      () => setExiting(true),
      TOAST_VISIBLE_MS,
    );
    const removeTimer = window.setTimeout(
      () => dismissRef.current(),
      TOAST_VISIBLE_MS + TOAST_EXIT_MS,
    );

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  function handleClose(): void {
    setExiting(true);
    window.setTimeout(() => dismissRef.current(), TOAST_EXIT_MS);
  }

  const Icon = tone === "success" ? CircleCheck : CircleAlert;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 flex justify-center px-4"
      style={{ zIndex: TOAST_Z_INDEX }}
    >
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-[min(92vw,420px)] items-start gap-3 rounded-[15px] border px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ${
          TONE_CLASS[tone]
        } ${exiting ? "animate-toast-out" : "animate-toast-in"}`}
      >
        <Icon
          className={`mt-0.5 size-5 shrink-0 ${TONE_ICON_CLASS[tone]}`}
          aria-hidden
        />
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={handleClose}
          aria-label={closeLabel}
          className="-mr-1 ml-1 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
