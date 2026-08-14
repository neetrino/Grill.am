"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
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
import { filterSelectOptions } from "@/features/checkout/domain/filter-select-options";
import type { CheckoutSelectOption } from "@/features/checkout/ui/CheckoutSelect";

type CheckoutSearchSelectProps = {
  label: string;
  placeholder: string;
  noResultsLabel: string;
  options: readonly CheckoutSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  hideLabel?: boolean;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

function SearchSelectChevron({ isOpen }: { isOpen: boolean }) {
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

/**
 * Combobox: click opens the list; typing in the same field filters options.
 */
export function CheckoutSearchSelect({
  label,
  placeholder,
  noResultsLabel,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  name,
  className = "",
  hideLabel = false,
}: CheckoutSearchSelectProps) {
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const triggerId = useId();
  const [query, setQuery] = useState("");
  const disclosure = useDropdownDisclosure({
    disabled,
    insideRefs: [containerRef, panelRef],
  });
  const menuPosition = useDropdownPortalPosition(
    disclosure.isVisible,
    triggerRef,
    { matchTriggerWidth: true },
  );

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(
    () =>
      disclosure.isOpen ? filterSelectOptions(options, query) : [...options],
    [disclosure.isOpen, options, query],
  );

  const { close: closeDropdown, open: openDropdown } = disclosure;

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setQuery("");
      closeDropdown();
    },
    [closeDropdown, onChange],
  );

  function openForTyping(): void {
    if (disabled || disclosure.isOpen) {
      return;
    }
    openDropdown();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const first = filteredOptions[0];
    if (first) {
      handleSelect(first.value);
    }
  }

  function onChevronClick(): void {
    if (disabled) {
      return;
    }
    if (disclosure.isOpen) {
      closeDropdown();
      return;
    }
    setQuery("");
    openDropdown();
    inputRef.current?.focus();
  }

  const triggerBorderClass = disclosure.isOpen
    ? "border-brand-red"
    : "border-gray-200";
  const inputValue = disclosure.isOpen ? query : (selectedOption?.label ?? "");
  const inputPlaceholder = selectedOption?.label ?? placeholder;

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
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-gray-500" role="presentation">
                {noResultsLabel}
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
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
              })
            )}
          </ul>,
          getDropdownPortalRoot(),
        )
      : null;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`.trim()}>
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

      <div
        ref={triggerRef}
        className={`flex h-11 min-w-0 items-center rounded-[15px] border transition-colors focus-within:border-brand-red/40 focus-within:ring-2 focus-within:ring-brand-red/15 ${
          disabled ? "bg-gray-50" : "bg-white"
        } ${triggerBorderClass}`}
      >
        <input
          ref={inputRef}
          id={triggerId}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-expanded={disclosure.isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-required={required || undefined}
          disabled={disabled}
          placeholder={inputPlaceholder}
          value={inputValue}
          onFocus={() => {
            if (!disclosure.isOpen) {
              setQuery("");
            }
            openForTyping();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            openForTyping();
          }}
          onKeyDown={onInputKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-hidden
          onClick={onChevronClick}
          className="flex h-full shrink-0 items-center px-3 text-gray-500 disabled:cursor-not-allowed"
        >
          <SearchSelectChevron isOpen={disclosure.isOpen} />
        </button>
      </div>

      {panel}
    </div>
  );
}
