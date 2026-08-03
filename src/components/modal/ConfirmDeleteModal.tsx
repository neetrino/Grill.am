"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  APP_MODAL_BACKDROP_IN_CLASS,
  APP_MODAL_BACKDROP_OUT_CLASS,
  APP_MODAL_EXIT_FALLBACK_MS,
  APP_MODAL_PANEL_IN_CLASS,
  APP_MODAL_PANEL_OUT_ANIMATION_NAME,
  APP_MODAL_PANEL_OUT_CLASS,
  APP_MODAL_Z_INDEX,
} from "@/components/modal/confirm-modal-motion";
import { Button } from "@/components/ui/Button";
import { useAnimatedModalDismiss } from "@/lib/ui/useAnimatedModalDismiss";

export type ConfirmModalTone = "danger" | "info";

const CONFIRM_BUTTON_TONE_CLASS: Record<ConfirmModalTone, string> = {
  danger:
    "!bg-brand-red !text-white hover:!bg-brand-red-hot focus:!ring-brand-red",
  info: "!bg-[#5281e1] !text-white hover:!bg-[#3f6dc9] focus:!ring-[#5281e1]",
};

export type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirming?: boolean;
  showCancel?: boolean;
  /** Confirm CTA color — `danger` (red) or `info` (status blue). */
  confirmTone?: ConfirmModalTone;
  onCancel: () => void;
  onConfirm: () => void;
};

type CachedModalContent = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel: boolean;
  confirmTone: ConfirmModalTone;
};

type ConfirmDeleteModalPanelProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  showCancel: boolean;
  confirming: boolean;
  actionsDisabled: boolean;
  confirmTone: ConfirmModalTone;
  panelMotionClass: string;
  onCancel: () => void;
  onConfirm: () => void;
  onAnimationEnd: (event: AnimationEvent<HTMLElement>) => void;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

function ConfirmDeleteModalPanel({
  title,
  message,
  confirmLabel,
  cancelLabel,
  showCancel,
  confirming,
  actionsDisabled,
  confirmTone,
  panelMotionClass,
  onCancel,
  onConfirm,
  onAnimationEnd,
}: ConfirmDeleteModalPanelProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-modal-title"
      aria-describedby="confirm-delete-modal-message"
      className={`relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl ${panelMotionClass}`}
      onClick={(event) => event.stopPropagation()}
      onAnimationEnd={onAnimationEnd}
    >
      <h3
        id="confirm-delete-modal-title"
        className="mb-2 text-lg font-semibold text-gray-900"
      >
        {title}
      </h3>
      <p
        id="confirm-delete-modal-message"
        className="text-sm leading-6 text-gray-600"
      >
        {message}
      </p>
      <div className="mt-5 flex items-center justify-end gap-3">
        {showCancel ? (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={actionsDisabled}
            className="min-w-24 !rounded-[15px]"
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={actionsDisabled}
          className={`min-w-24 !rounded-[15px] ${CONFIRM_BUTTON_TONE_CLASS[confirmTone]}`}
        >
          {confirming ? `${confirmLabel}...` : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function ConfirmDeleteModalShell({
  cancelLabel,
  actionsDisabled,
  backdropMotionClass,
  onCancel,
  children,
}: {
  cancelLabel: string;
  actionsDisabled: boolean;
  backdropMotionClass: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: APP_MODAL_Z_INDEX }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={cancelLabel}
        className={`absolute inset-0 cursor-default rounded-none bg-black/40 ${backdropMotionClass}`}
        onClick={() => {
          if (!actionsDisabled) {
            onCancel();
          }
        }}
      />
      {children}
    </div>
  );
}

/** Centered delete confirmation — storefront + admin (MaMarie motion). */
export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirming = false,
  showCancel = true,
  confirmTone = "danger",
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const isBrowser = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const {
    isVisible,
    isExiting,
    handlePanelAnimationEnd,
    backdropMotionClass,
    panelMotionClass,
  } = useAnimatedModalDismiss({
    isOpen,
    panelOutAnimationName: APP_MODAL_PANEL_OUT_ANIMATION_NAME,
    exitFallbackMs: APP_MODAL_EXIT_FALLBACK_MS,
    backdropInClass: APP_MODAL_BACKDROP_IN_CLASS,
    backdropOutClass: APP_MODAL_BACKDROP_OUT_CLASS,
    panelInClass: APP_MODAL_PANEL_IN_CLASS,
    panelOutClass: APP_MODAL_PANEL_OUT_CLASS,
  });

  const [cached, setCached] = useState<CachedModalContent>({
    title,
    message,
    confirmText,
    cancelText,
    showCancel,
    confirmTone,
  });

  const actionsDisabled = confirming || isExiting;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setCached({
      title,
      message,
      confirmText,
      cancelText,
      showCancel,
      confirmTone,
    });
  }, [isOpen, title, message, confirmText, cancelText, showCancel, confirmTone]);

  useEffect(() => {
    if (!isVisible || actionsDisabled) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, actionsDisabled, onCancel]);

  if (!isBrowser || !isVisible) {
    return null;
  }

  return createPortal(
    <ConfirmDeleteModalShell
      cancelLabel={cached.cancelText ?? cancelText}
      actionsDisabled={actionsDisabled}
      backdropMotionClass={backdropMotionClass}
      onCancel={onCancel}
    >
      <ConfirmDeleteModalPanel
        title={cached.title}
        message={cached.message}
        confirmLabel={cached.confirmText ?? confirmText}
        cancelLabel={cached.cancelText ?? cancelText}
        showCancel={cached.showCancel}
        confirming={confirming}
        actionsDisabled={actionsDisabled}
        confirmTone={cached.confirmTone}
        panelMotionClass={panelMotionClass}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onAnimationEnd={handlePanelAnimationEnd}
      />
    </ConfirmDeleteModalShell>,
    document.body,
  );
}
