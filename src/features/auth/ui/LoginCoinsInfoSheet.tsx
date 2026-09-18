"use client";

import { X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type AnimationEvent,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";

import { LoginCoinsInfoContent } from "@/features/auth/ui/LoginCoinsInfoCard";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const MOBILE_MQ = "(max-width: 1023px)";
const SHEET_Z_INDEX = 80;
const PANEL_MS = 320;
const PANEL_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function subscribeMobile(onChange: () => void): () => void {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_MQ).matches;
}

type SheetPhase = "enter" | "open" | "exit";

type LoginCoinsInfoSheetProps = {
  copy: Dictionary["auth"]["coinsGate"];
  closeLabel: string;
  title: string;
};

/**
 * Mobile guest-coins gate — bottom sheet with coin info, then the login form.
 */
export function LoginCoinsInfoSheet({
  copy,
  closeLabel,
  title,
}: LoginCoinsInfoSheetProps) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    () => false,
  );
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(true);
  const [phase, setPhase] = useState<SheetPhase>("enter");

  const closeSheet = useCallback(() => {
    if (reduceMotion) {
      setMounted(false);
      return;
    }
    setPhase((current) => (current === "exit" ? current : "exit"));
  }, [reduceMotion]);

  useEffect(() => {
    if (!mounted || !isMobile) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeSheet();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, isMobile, closeSheet]);

  useEffect(() => {
    if (phase !== "exit") {
      return;
    }
    const timer = window.setTimeout(() => {
      setMounted(false);
    }, PANEL_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function handleEnterEnd(event: AnimationEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget || phase !== "enter") {
      return;
    }
    setPhase("open");
  }

  function handleExitEnd(event: TransitionEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget || phase !== "exit") {
      return;
    }
    if (event.propertyName !== "transform") {
      return;
    }
    setMounted(false);
  }

  if (!mounted || !isMobile) {
    return null;
  }

  const isEntering = phase === "enter";
  const isExiting = phase === "exit";

  return createPortal(
    <div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: SHEET_Z_INDEX }}
      aria-hidden={isExiting}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        className={`profile-sheet-settle absolute inset-0 border-0 bg-black/45 ${
          isEntering ? "animate-profile-sheet-backdrop-in" : ""
        }`}
        style={{
          opacity: isExiting ? 0 : 1,
          transition: isExiting
            ? `opacity ${PANEL_MS}ms ${PANEL_EASE}`
            : undefined,
          pointerEvents: isExiting ? "none" : "auto",
        }}
        onClick={closeSheet}
      />
      <div
        className={`profile-sheet-settle relative w-full will-change-transform ${
          isEntering ? "animate-profile-sheet-in" : ""
        }`}
        style={{
          transform: isExiting ? "translate3d(0, 100%, 0)" : undefined,
          transition: isExiting
            ? `transform ${PANEL_MS}ms ${PANEL_EASE}`
            : undefined,
        }}
        onAnimationEnd={handleEnterEnd}
        onTransitionEnd={handleExitEnd}
      >
        <button
          type="button"
          onClick={closeSheet}
          aria-label={closeLabel}
          className="absolute top-0 right-4 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-ink shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
        >
          <X className="size-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="rounded-t-[28px] bg-brand-ink px-7 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgba(0,0,0,0.28)]"
        >
          <LoginCoinsInfoContent copy={copy} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
