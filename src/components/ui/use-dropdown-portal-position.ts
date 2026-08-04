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
 * Inside DesktopFluidFrame, coordinates are layout-space (visual / zoom) and
 * viewport-relative so sticky header menus stay under the trigger after scroll.
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
      const scale = fluid ? getDesktopLayoutScale() : 1;

      // Portal panels use `position: fixed` (viewport). Inside DesktopFluidFrame
      // CSS `zoom`, layout px = visual rect / scale. Do not subtract stageRect:
      // that encodes scroll and pushes menus far below the sticky header.
      if (fluid && scale > 0) {
        const pad = VIEWPORT_PADDING_PX / scale;
        const viewportWidth = window.innerWidth / scale;
        const viewportHeight = window.innerHeight / scale;
        const triggerWidth = rect.width / scale;
        const triggerLeft = rect.left / scale;
        const triggerRight = (window.innerWidth - rect.right) / scale;
        const triggerTop = rect.top / scale;
        const triggerBottom = rect.bottom / scale;

        const minWidth = matchTriggerWidth
          ? Math.min(Math.max(triggerWidth, 0), viewportWidth - pad * 2)
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
                    viewportWidth - pad - (minWidth ?? 0),
                  ),
                ),
              };

        if (placement === "top") {
          setPosition({
            bottom: viewportHeight - triggerTop + gapPx,
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
