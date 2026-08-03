"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  DROPDOWN_PANEL_ANCHORED_CLASS,
  dropdownOptionClass,
  dropdownPanelStateClass,
} from "@/components/ui/dropdown-styles";
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
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  orderStatusLabel,
  type OrderStatus,
} from "@/features/orders/domain/order-status";
import {
  ADMIN_PAYMENT_STATUS_OPTIONS,
  paymentStatusLabel,
  type PaymentStatus,
} from "@/features/orders/domain/payment-status";
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
};

export function AdminInlineStatusSelect({
  locale,
  orderNumber,
  kind,
  value,
  disabled = false,
}: AdminInlineStatusSelectProps) {
  const dictionary = useAdminDictionary();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const options =
    kind === "order"
      ? ADMIN_ORDER_STATUS_OPTIONS
      : ADMIN_PAYMENT_STATUS_OPTIONS;

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

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectStatus(next: string): void {
    if (next === displayValue || isPending || disabled) {
      setOpen(false);
      return;
    }

    const previous = displayValue;
    setDisplayValue(next);
    setOpen(false);

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
        setError(result.error.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        type="button"
        disabled={disabled || isPending}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${badgeClassName}`}
        aria-label={formatAdminMessage(dictionary.orders.changeStatusAria, {
          kind,
        })}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((valueOpen) => !valueOpen)}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </button>

      {open ? (
        <ul
          id={menuId}
          role="listbox"
          className={`${DROPDOWN_PANEL_ANCHORED_CLASS} z-[300] overflow-hidden py-1 ${dropdownPanelStateClass(true)}`}
        >
          {options.map((option) => {
            const selected =
              option.value === displayValue ||
              (kind === "order" &&
                orderStatusLabel(displayValue) === option.label) ||
              (kind === "payment" &&
                paymentStatusLabel(displayValue) === option.label);
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={isPending}
                  className={dropdownOptionClass(selected)}
                  onClick={() => selectStatus(option.value)}
                >
                  {optionDisplayLabel(option.value)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <p className="mt-1 whitespace-nowrap text-[10px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
