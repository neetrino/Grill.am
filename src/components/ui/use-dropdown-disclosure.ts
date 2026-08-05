"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { DROPDOWN_ANIMATION_MS } from "@/components/ui/dropdown-styles";

export type DropdownDisclosure = {
  /** Trigger state (aria-expanded, chevron rotation). */
  isOpen: boolean;
  /** Panel is mounted — stays true during the closing animation. */
  isVisible: boolean;
  /** Panel is in its open transition state. */
  isExpanded: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

type UseDropdownDisclosureOptions = {
  disabled?: boolean;
  /** Elements that must not close the panel when clicked (trigger, panel). */
  insideRefs: readonly RefObject<HTMLElement | null>[];
};

/**
 * Open/close lifecycle shared by portal dropdown panels: keeps the panel
 * mounted for the closing animation and closes on outside click / Escape.
 */
export function useDropdownDisclosure({
  disabled = false,
  insideRefs,
}: UseDropdownDisclosureOptions): DropdownDisclosure {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insideRefsRef = useRef(insideRefs);

  useEffect(() => {
    insideRefsRef.current = insideRefs;
  });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
    setIsExpanded(false);
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      closeTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }, [clearCloseTimer]);

  const open = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
    setIsVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsExpanded(true);
      });
    });
  }, [clearCloseTimer]);

  const toggle = useCallback(() => {
    if (disabled) {
      return;
    }
    if (isOpen) {
      close();
      return;
    }
    open();
  }, [close, disabled, isOpen, open]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = insideRefsRef.current.some((ref) =>
        ref.current?.contains(target),
      );
      if (isInside) {
        return;
      }
      close();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [close, isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  return { isOpen, isVisible, isExpanded, open, close, toggle };
}
