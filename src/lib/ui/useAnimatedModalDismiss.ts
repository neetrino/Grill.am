"use client";

import { useCallback, useEffect, useState, type AnimationEvent } from "react";

import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";

type UseAnimatedModalDismissOptions = {
  isOpen: boolean;
  panelOutAnimationName: string;
  exitFallbackMs: number;
  backdropInClass: string;
  backdropOutClass: string;
  panelInClass: string;
  panelOutClass: string;
  lockBodyScroll?: boolean;
};

type UseAnimatedModalDismissResult = {
  isVisible: boolean;
  isExiting: boolean;
  handlePanelAnimationEnd: (event: AnimationEvent<HTMLElement>) => void;
  backdropMotionClass: string;
  panelMotionClass: string;
};

/**
 * Keeps a modal mounted through exit keyframes when `isOpen` flips false
 * (same enter/exit timing as MaMarie / Mobee confirm dialog).
 */
export function useAnimatedModalDismiss({
  isOpen,
  panelOutAnimationName,
  exitFallbackMs,
  backdropInClass,
  backdropOutClass,
  panelInClass,
  panelOutClass,
  lockBodyScroll = true,
}: UseAnimatedModalDismissOptions): UseAnimatedModalDismissResult {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useBodyScrollLock(lockBodyScroll && isMounted);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsExiting(false);
      return;
    }

    if (!isMounted) {
      return;
    }

    setIsExiting(true);
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (!isExiting) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsMounted(false);
      setIsExiting(false);
    }, exitFallbackMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isExiting, exitFallbackMs]);

  const handlePanelAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      if (!event.animationName.includes(panelOutAnimationName)) {
        return;
      }
      setIsMounted(false);
      setIsExiting(false);
    },
    [panelOutAnimationName],
  );

  return {
    isVisible: isMounted,
    isExiting,
    handlePanelAnimationEnd,
    backdropMotionClass: isExiting ? backdropOutClass : backdropInClass,
    panelMotionClass: isExiting ? panelOutClass : panelInClass,
  };
}
