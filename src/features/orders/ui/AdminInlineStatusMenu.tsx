import type { RefObject } from "react";

import {
  dropdownOptionClass,
  dropdownPanelStateClass,
  dropdownPortalStyle,
  DROPDOWN_PANEL_PORTAL_CLASS,
  type DropdownPortalPosition,
} from "@/components/ui/dropdown-styles";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  orderStatusLabel,
} from "@/features/orders/domain/order-status";
import {
  ADMIN_PAYMENT_STATUS_OPTIONS,
  paymentStatusLabel,
} from "@/features/orders/domain/payment-status";

type AdminInlineStatusMenuProps = {
  kind: "order" | "payment";
  displayValue: string;
  isPending: boolean;
  menuId: string;
  menuPosition: DropdownPortalPosition;
  panelExpanded: boolean;
  panelRef: RefObject<HTMLUListElement | null>;
  optionLabel: (value: string) => string;
  onSelect: (value: string) => void;
};

const OPTIONS = {
  order: ADMIN_ORDER_STATUS_OPTIONS,
  payment: ADMIN_PAYMENT_STATUS_OPTIONS,
} as const;

/** Portal listbox for admin order/payment status pills. */
export function AdminInlineStatusMenu({
  kind,
  displayValue,
  isPending,
  menuId,
  menuPosition,
  panelExpanded,
  panelRef,
  optionLabel,
  onSelect,
}: AdminInlineStatusMenuProps) {
  const options = OPTIONS[kind];

  return (
    <ul
      ref={panelRef}
      id={menuId}
      role="listbox"
      className={`${DROPDOWN_PANEL_PORTAL_CLASS} overflow-hidden py-1 ${dropdownPanelStateClass(panelExpanded)}`}
      style={dropdownPortalStyle({
        ...menuPosition,
        maxHeight: "none",
      })}
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
              className={`${dropdownOptionClass(selected)} uppercase`}
              onClick={() => onSelect(option.value)}
            >
              {optionLabel(option.value)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
