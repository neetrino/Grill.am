"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusPollerProps = {
  /** When true, poll local page refreshes only (no provider calls). */
  enabled: boolean;
  checkingLabel: string;
  manualCheckLabel: string;
  /** Max automatic refresh attempts. */
  maxAttempts?: number;
  /** Interval between refreshes in ms. */
  intervalMs?: number;
};

const DEFAULT_MAX_ATTEMPTS = 6;
const DEFAULT_INTERVAL_MS = 2500;

/**
 * Bounded local-state polling for delayed provider confirmation races.
 * Never creates payment attempts and never calls provider APIs.
 */
export function PaymentStatusPoller({
  enabled,
  checkingLabel,
  manualCheckLabel,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
}: PaymentStatusPollerProps) {
  const router = useRouter();
  const attemptsRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);
  const [checking, setChecking] = useState(enabled);

  useEffect(() => {
    if (!enabled || exhausted) {
      return;
    }

    const timer = window.setInterval(() => {
      attemptsRef.current += 1;
      router.refresh();
      if (attemptsRef.current >= maxAttempts) {
        window.clearInterval(timer);
        setExhausted(true);
        setChecking(false);
      }
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, exhausted, intervalMs, maxAttempts, router]);

  if (!enabled && !exhausted) {
    return null;
  }

  return (
    <div className="mt-4 text-center" role="status" aria-live="polite">
      {checking && !exhausted ? (
        <p className="text-sm text-gray-600">{checkingLabel}</p>
      ) : null}
      {exhausted ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-brand-red underline"
          onClick={() => {
            setChecking(true);
            router.refresh();
            window.setTimeout(() => setChecking(false), 800);
          }}
        >
          {manualCheckLabel}
        </button>
      ) : null}
    </div>
  );
}
