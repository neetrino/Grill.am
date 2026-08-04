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

import {
  PROFILE_MOBILE_SHEET_CONTENT_PAD_BOTTOM_PX,
  PROFILE_MOBILE_SHEET_CONTENT_PAD_TOP_PX,
  PROFILE_MOBILE_SHEET_CONTENT_PAD_X_PX,
  PROFILE_MOBILE_SHEET_DISMISS_DRAG_PX,
  PROFILE_MOBILE_SHEET_DRAG_ZONE_HEIGHT_PX,
  PROFILE_MOBILE_SHEET_HANDLE_HEIGHT_PX,
  PROFILE_MOBILE_SHEET_HANDLE_WIDTH_PX,
  PROFILE_MOBILE_SHEET_HEIGHT_VH,
  PROFILE_MOBILE_SHEET_PANEL_EASE,
  PROFILE_MOBILE_SHEET_PANEL_MS,
  PROFILE_MOBILE_SHEET_Z_INDEX,
} from "@/features/profile/ui/profile-ui";

const DISMISS_VELOCITY = 0.5;

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
 * MaMarie profile mobile tab sheet — 72vh panel, handle drag dismiss.
 * Title lives in sheet content; chrome is handle-only.
 */
export function ProfileMobileSheet({
  open,
  title,
  closeLabel,
  onClose,
  children,
  heightVh = PROFILE_MOBILE_SHEET_HEIGHT_VH,
}: ProfileMobileSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<SheetPhase>("enter");
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(0);
  const dragYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTsRef = useRef(0);
  const velocityRef = useRef(0);
  // Tracks the `open` prop value last synced into mount/phase state.
  const [openSynced, setOpenSynced] = useState(open);

  // Adjust mount/exit state during render when `open` flips (React
  // "adjusting state on prop change" pattern) instead of a synchronous
  // setState inside an effect. Only ever runs once per genuine `open`
  // transition, so no re-entrancy guard is needed.
  if (open !== openSynced) {
    setOpenSynced(open);
    if (open) {
      setMounted(true);
      setPhase("enter");
      setDragY(0);
    } else if (mounted) {
      setPhase("exit");
      setDragY(0);
    }
  }

  // Keeps the imperative drag-tracking ref in sync with `dragY`, including
  // the render-time resets above (refs cannot be written during render).
  useEffect(() => {
    dragYRef.current = dragY;
  }, [dragY]);

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
        dragYRef.current >= PROFILE_MOBILE_SHEET_DISMISS_DRAG_PX ||
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
        className={`fixed inset-0 rounded-none border-0 bg-[#11182759] ${backdropClassName}`}
        style={{
          opacity: isDragging
            ? Math.max(0.08, 0.35 * (1 - dragY / 360))
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
              ? `transform ${PROFILE_MOBILE_SHEET_PANEL_MS}ms ${PROFILE_MOBILE_SHEET_PANEL_EASE}`
              : undefined,
        }}
        onAnimationEnd={handleSheetAnimationEnd}
      >
        <div
          className="flex shrink-0 touch-none flex-col items-center justify-center"
          style={{ height: PROFILE_MOBILE_SHEET_DRAG_ZONE_HEIGHT_PX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="rounded-full bg-gray-300"
            style={{
              width: PROFILE_MOBILE_SHEET_HANDLE_WIDTH_PX,
              height: PROFILE_MOBILE_SHEET_HANDLE_HEIGHT_PX,
            }}
            aria-hidden
          />
        </div>
        <div
          className="profile-mobile-tab-sheet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            paddingLeft: PROFILE_MOBILE_SHEET_CONTENT_PAD_X_PX,
            paddingRight: PROFILE_MOBILE_SHEET_CONTENT_PAD_X_PX,
            paddingTop: PROFILE_MOBILE_SHEET_CONTENT_PAD_TOP_PX,
            paddingBottom: `max(${PROFILE_MOBILE_SHEET_CONTENT_PAD_BOTTOM_PX}px, env(safe-area-inset-bottom))`,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
