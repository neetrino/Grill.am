"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import {
  DROPDOWN_GAP_PX,
  type DropdownPortalPosition,
} from "@/components/ui/dropdown-styles";

const VIEWPORT_PADDING_PX = 16;

type UseDropdownPortalPositionOptions = {
  /** Use trigger width as min (and optionally max) width. */
  matchTriggerWidth?: boolean;
  /** Also clamp max width to the trigger width. */
  lockTriggerWidth?: boolean;
  gapPx?: number;
  align?: "left" | "right";
  /** Open below (default) or above the trigger. */
  placement?: "bottom" | "top";
};

/**
 * Positions a fixed portal dropdown under/above a trigger; tracks scroll/resize.
 */
export function useDropdownPortalPosition(
  active: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: UseDropdownPortalPositionOptions = {},
): DropdownPortalPosition | null {
  const {
    matchTriggerWidth = true,
    lockTriggerWidth = false,
    gapPx = DROPDOWN_GAP_PX,
    align = "left",
    placement = "bottom",
  } = options;
  const [position, setPosition] = useState<DropdownPortalPosition | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setPosition(null);
      return;
    }

    function updatePosition(): void {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const available = window.innerWidth - VIEWPORT_PADDING_PX * 2;
      const minWidth = matchTriggerWidth
        ? Math.min(Math.max(rect.width, 0), available)
        : undefined;
      const widthForAlign = minWidth ?? Math.min(180, available);
      const preferredLeft =
        align === "right" ? rect.right - widthForAlign : rect.left;
      const left = Math.max(
        VIEWPORT_PADDING_PX,
        Math.min(
          preferredLeft,
          window.innerWidth - widthForAlign - VIEWPORT_PADDING_PX,
        ),
      );

      if (placement === "top") {
        setPosition({
          bottom: window.innerHeight - rect.top + gapPx,
          left,
          minWidth,
          maxWidth: lockTriggerWidth ? minWidth : undefined,
        });
        return;
      }

      setPosition({
        top: rect.bottom + gapPx,
        left,
        minWidth,
        maxWidth: lockTriggerWidth ? minWidth : undefined,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [
    active,
    align,
    gapPx,
    lockTriggerWidth,
    matchTriggerWidth,
    placement,
    triggerRef,
  ]);

  return position;
}
