"use client";

import { useCallback, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";

import {
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownOptionClass,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownDisclosure } from "@/components/ui/use-dropdown-disclosure";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";

export type CheckoutSelectOption = {
  value: string;
  label: string;
};

type CheckoutSelectProps = {
  label: string;
  placeholder: string;
  options: readonly CheckoutSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  /** Hide the visible label (keeps it available to assistive tech). */
  hideLabel?: boolean;
  /** Shrink trigger to content width (filter bars). */
  fitContent?: boolean;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

function SelectChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-gray-500 transition-transform duration-150 ease-out ${
        isOpen ? "rotate-180" : "rotate-0"
      }`}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Checkout / admin select — portal panel so lists paint above sheets. */
export function CheckoutSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  name,
  className = "",
  hideLabel = false,
  fitContent = false,
}: CheckoutSelectProps) {
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const triggerId = useId();
  const disclosure = useDropdownDisclosure({
    disabled,
    insideRefs: [containerRef, panelRef],
  });
  const menuPosition = useDropdownPortalPosition(
    disclosure.isVisible,
    triggerRef,
    { matchTriggerWidth: true, lockTriggerWidth: fitContent },
  );

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;

  const { close: closeDropdown } = disclosure;

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      closeDropdown();
    },
    [closeDropdown, onChange],
  );

  const triggerBorderClass = disclosure.isOpen
    ? "border-brand-red"
    : "border-gray-200";

  const panel =
    canPortal && disclosure.isVisible && menuPosition
      ? createPortal(
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            className={`${DROPDOWN_PANEL_PORTAL_CLASS} ${dropdownPanelStateClass(disclosure.isExpanded)}`}
            style={dropdownPortalStyle(menuPosition)}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value || "__empty__"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={dropdownOptionClass(isSelected)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          getDropdownPortalRoot(),
        )
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative ${fitContent ? "w-fit max-w-full" : "w-full"} ${className}`.trim()}
    >
      <label
        htmlFor={triggerId}
        className={
          hideLabel
            ? "sr-only"
            : "mb-1.5 block text-sm font-medium text-gray-700"
        }
      >
        {label}
      </label>

      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          suppressHydrationWarning
        />
      ) : null}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={disclosure.isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        disabled={disabled}
        onClick={disclosure.toggle}
        className={`flex h-11 min-w-0 items-center justify-between gap-3 rounded-[15px] border bg-white px-3 text-left transition-colors outline-none focus-visible:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red/15 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          fitContent ? "w-fit" : "w-full"
        } ${triggerBorderClass}`}
      >
        <span
          className={`truncate text-sm ${
            isPlaceholder ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {displayLabel}
        </span>
        <SelectChevron isOpen={disclosure.isOpen} />
      </button>

      {panel}
    </div>
  );
}
