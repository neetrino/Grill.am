"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

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

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
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
      ? orderStatusLabel(displayValue)
      : paymentStatusLabel(displayValue);

  const badgeClassName =
    kind === "order"
      ? orderStatusBadgeClass(displayValue)
      : paymentStatusBadgeClass(displayValue);

  function updateMenuPosition(): void {
    const trigger = rootRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 144),
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    function handleReposition(): void {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
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

  const menu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="listbox"
            className="fixed z-[200] overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-xs shadow-lg"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
            }}
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
                    className={`flex w-full px-3 py-1.5 text-left ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                    onClick={() => selectStatus(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || isPending}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${badgeClassName}`}
        aria-label={`Change ${kind} status`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((valueOpen) => !valueOpen)}
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </button>

      {menu}

      {error ? (
        <p className="mt-1 whitespace-nowrap text-[10px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
