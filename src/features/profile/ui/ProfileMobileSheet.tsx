"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { PROFILE_MOBILE_SHEET_Z_INDEX } from "@/features/profile/ui/profile-ui";

const DISMISS_DISTANCE_PX = 110;
const DISMISS_VELOCITY = 0.5;
const SNAP_MS = 280;
const SNAP_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

type ProfileMobileSheetProps = {
  open: boolean;
  /** Accessible name for the dialog (not shown in the chrome). */
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  heightVh?: number;
};

type SheetPhase = "enter" | "open" | "drag" | "exit";

/**
 * MaMarie-style bottom sheet — CSS keyframe rise, swipe-down dismiss.
 * Title lives in sheet content; chrome is handle-only.
 */
export function ProfileMobileSheet({
  open,
  title,
  closeLabel,
  onClose,
  children,
  heightVh = 92,
}: ProfileMobileSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<SheetPhase>("enter");
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(0);
  const dragYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTsRef = useRef(0);
  const velocityRef = useRef(0);
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      setPhase("enter");
      setDragY(0);
      dragYRef.current = 0;
      return;
    }

    if (!mounted || closingRef.current) {
      return;
    }

    closingRef.current = true;
    setPhase("exit");
    setDragY(0);
    dragYRef.current = 0;
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  function handleSheetAnimationEnd(event: AnimationEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (phase === "enter") {
      setPhase("open");
      return;
    }
    if (phase === "exit") {
      setMounted(false);
      closingRef.current = false;
    }
  }

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || phase === "exit" || phase === "enter") {
        return;
      }
      dragStartYRef.current = event.clientY - dragYRef.current;
      lastYRef.current = event.clientY;
      lastTsRef.current = event.timeStamp;
      velocityRef.current = 0;
      setPhase("drag");
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [phase],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      const delta = Math.max(0, event.clientY - dragStartYRef.current);
      const dt = event.timeStamp - lastTsRef.current;
      if (dt > 0) {
        velocityRef.current = (event.clientY - lastYRef.current) / dt;
      }
      lastYRef.current = event.clientY;
      lastTsRef.current = event.timeStamp;
      dragYRef.current = delta;
      setDragY(delta);
    },
    [],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      event.currentTarget.releasePointerCapture(event.pointerId);
      const shouldClose =
        dragYRef.current >= DISMISS_DISTANCE_PX ||
        velocityRef.current >= DISMISS_VELOCITY;
      if (shouldClose) {
        onClose();
        return;
      }
      setDragY(0);
      dragYRef.current = 0;
      setPhase("open");
    },
    [onClose],
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const isDragging = phase === "drag";
  const sheetClassName =
    phase === "enter"
      ? "animate-profile-sheet-in"
      : phase === "exit"
        ? "animate-profile-sheet-out"
        : "";
  const backdropClassName =
    phase === "exit"
      ? "animate-profile-sheet-backdrop-out"
      : "animate-profile-sheet-backdrop-in";

  return createPortal(
    <div
      className="fixed inset-0 flex items-end overscroll-none lg:hidden"
      style={{ zIndex: PROFILE_MOBILE_SHEET_Z_INDEX }}
      aria-hidden={phase === "exit"}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        className={`fixed inset-0 rounded-none border-0 bg-black/40 backdrop-blur-[2px] ${backdropClassName}`}
        style={{
          opacity: isDragging
            ? Math.max(0.08, 0.4 * (1 - dragY / 360))
            : undefined,
          animation: isDragging ? "none" : undefined,
          pointerEvents: phase === "exit" ? "none" : "auto",
        }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] will-change-transform ${sheetClassName}`}
        style={{
          height: `${heightVh}dvh`,
          transform: isDragging
            ? `translate3d(0, ${dragY}px, 0)`
            : phase === "open"
              ? "translate3d(0, 0, 0)"
              : undefined,
          transition:
            phase === "open" && dragY === 0
              ? `transform ${SNAP_MS}ms ${SNAP_EASE}`
              : undefined,
        }}
        onAnimationEnd={handleSheetAnimationEnd}
      >
        <div
          className="flex shrink-0 touch-none flex-col items-center px-5 pt-3 pb-2"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="h-1.5 w-12 rounded-full bg-gray-300" aria-hidden />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(2rem,env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
