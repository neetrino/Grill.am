"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import {
  DROPDOWN_GAP_PX,
  type DropdownPortalPosition,
} from "@/components/ui/dropdown-styles";
import {
  getDesktopLayoutScale,
  isDesktopFluidActive,
} from "@/components/ui/dropdown-portal-root";

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
 * Inside DesktopFluidFrame, coordinates are layout-space (pre-zoom) relative
 * to the fluid stage so the panel matches site scale.
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
      const fluid = isDesktopFluidActive();
      const stage = fluid
        ? document.querySelector(".desktop-fluid-stage")
        : null;
      const scale = fluid ? getDesktopLayoutScale() : 1;

      if (fluid && stage instanceof HTMLElement && scale > 0) {
        const stageRect = stage.getBoundingClientRect();
        const pad = VIEWPORT_PADDING_PX / scale;
        const stageWidth = stageRect.width / scale;
        const triggerWidth = rect.width / scale;
        const triggerLeft = (rect.left - stageRect.left) / scale;
        const triggerRight = (stageRect.right - rect.right) / scale;
        const triggerTop = (rect.top - stageRect.top) / scale;
        const triggerBottom = (rect.bottom - stageRect.top) / scale;

        const minWidth = matchTriggerWidth
          ? Math.min(Math.max(triggerWidth, 0), stageWidth - pad * 2)
          : undefined;
        const maxWidth = lockTriggerWidth ? minWidth : undefined;

        const horizontal =
          align === "right"
            ? {
                right: Math.max(pad, triggerRight),
              }
            : {
                left: Math.max(
                  pad,
                  Math.min(
                    triggerLeft,
                    stageWidth - pad - (minWidth ?? 0),
                  ),
                ),
              };

        if (placement === "top") {
          setPosition({
            bottom: stageRect.height / scale - triggerTop + gapPx,
            ...horizontal,
            minWidth,
            maxWidth,
          });
          return;
        }

        setPosition({
          top: triggerBottom + gapPx,
          ...horizontal,
          minWidth,
          maxWidth,
        });
        return;
      }

      const available = window.innerWidth - VIEWPORT_PADDING_PX * 2;
      const minWidth = matchTriggerWidth
        ? Math.min(Math.max(rect.width, 0), available)
        : undefined;
      const maxWidth = lockTriggerWidth ? minWidth : undefined;

      const horizontal =
        align === "right"
          ? {
              right: Math.max(
                VIEWPORT_PADDING_PX,
                window.innerWidth - rect.right,
              ),
            }
          : {
              left: Math.max(
                VIEWPORT_PADDING_PX,
                Math.min(
                  rect.left,
                  window.innerWidth -
                    VIEWPORT_PADDING_PX -
                    (minWidth ?? 0),
                ),
              ),
            };

      if (placement === "top") {
        setPosition({
          bottom: window.innerHeight - rect.top + gapPx,
          ...horizontal,
          minWidth,
          maxWidth,
        });
        return;
      }

      setPosition({
        top: rect.bottom + gapPx,
        ...horizontal,
        minWidth,
        maxWidth,
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
