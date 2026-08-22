"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";
import { DROPDOWN_ANIMATION_MS } from "@/components/ui/dropdown-styles";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { changeOrderStatusAction } from "@/features/orders/application/change-order-status";
import { changePaymentStatusAction } from "@/features/orders/application/change-payment-status";
import { type OrderStatus } from "@/features/orders/domain/order-status";
import { type PaymentStatus } from "@/features/orders/domain/payment-status";
import { AdminInlineStatusMenu } from "@/features/orders/ui/AdminInlineStatusMenu";
import { resolveAdminPaymentStatusError } from "@/features/orders/ui/admin-payment-status-error";
import { buildAdminStatusChangeConfirm } from "@/features/orders/ui/admin-status-change-confirm";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";

type AdminInlineStatusSelectProps = {
  locale: string;
  orderNumber: string;
  kind: "order" | "payment";
  value: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

export function AdminInlineStatusSelect({
  locale,
  orderNumber,
  kind,
  value,
  disabled = false,
  onSuccess,
}: AdminInlineStatusSelectProps) {
  const dictionary = useAdminDictionary();
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const menuPosition = useDropdownPortalPosition(panelVisible, triggerRef, {
    matchTriggerWidth: true,
  });

  if (value !== syncedValue) {
    setSyncedValue(value);
    setDisplayValue(value);
  }

  const currentLabel =
    kind === "order"
      ? adminOrderStatusLabel(displayValue, dictionary.orders.status)
      : adminPaymentStatusLabel(displayValue, dictionary.orders.paymentStatus);

  const badgeClassName =
    kind === "order"
      ? orderStatusBadgeClass(displayValue)
      : paymentStatusBadgeClass(displayValue);

  function optionDisplayLabel(optionValue: string): string {
    return kind === "order"
      ? adminOrderStatusLabel(optionValue, dictionary.orders.status)
      : adminPaymentStatusLabel(optionValue, dictionary.orders.paymentStatus);
  }

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeDropdown = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
    setPanelExpanded(false);
    closeTimerRef.current = setTimeout(() => {
      setPanelVisible(false);
      closeTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }, [clearCloseTimer]);

  const openDropdown = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
    setPanelVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelExpanded(true);
      });
    });
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeDropdown();
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDropdown();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closeDropdown, open]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  function selectStatus(next: string): void {
    if (next === displayValue || isPending || disabled) {
      closeDropdown();
      return;
    }

    const previous = displayValue;
    const fromLabel = currentLabel;
    const toLabel = optionDisplayLabel(next);
    closeDropdown();

    void (async () => {
      const accepted = await confirmDelete(
        buildAdminStatusChangeConfirm({
          kind,
          fromLabel,
          toValue: next,
          toLabel,
          copy: dictionary.orders.statusConfirm,
        }),
      );
      if (!accepted) {
        return;
      }

      setDisplayValue(next);
      startTransition(async () => {
        setError(null);
        const result =
          kind === "order"
            ? await changeOrderStatusAction(locale, {
                orderNumber,
                toStatus: next as OrderStatus,
              })
            : await changePaymentStatusAction(locale, {
                orderNumber,
                toStatus: next as PaymentStatus,
              });

        if (!result.ok) {
          setDisplayValue(previous);
          setError(
            kind === "payment"
              ? resolveAdminPaymentStatusError(
                  dictionary.orders.paymentRefundErrors,
                  result.error.code,
                  result.error.message,
                )
              : result.error.message,
          );
          return;
        }

        router.refresh();
        onSuccess?.();
      });
    })();
  }

  const panel =
    canPortal && panelVisible && menuPosition
      ? createPortal(
          <AdminInlineStatusMenu
            kind={kind}
            displayValue={displayValue}
            isPending={isPending}
            menuId={menuId}
            menuPosition={menuPosition}
            panelExpanded={panelExpanded}
            panelRef={panelRef}
            optionLabel={optionDisplayLabel}
            onSelect={selectStatus}
          />,
          getDropdownPortalRoot(),
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || isPending}
        className={`inline-flex items-center gap-1 rounded-[15px] px-2 py-1 text-xs font-medium uppercase transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${badgeClassName}`}
        aria-label={formatAdminMessage(dictionary.orders.changeStatusAria, {
          kind,
        })}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (open) {
            closeDropdown();
            return;
          }
          openDropdown();
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 opacity-70 transition-transform duration-150 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>

      {panel}

      {error ? (
        <p className="mt-1 max-w-[16rem] text-left text-[10px] leading-snug text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
