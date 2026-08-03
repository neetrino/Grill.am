"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_ANCHORED_CLASS,
  dropdownOptionClass,
  dropdownPanelStateClass,
} from "@/components/ui/dropdown-styles";

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

/** Checkout location select — uses global dropdown panel styles. */
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
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();
  const triggerId = useId();

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeDropdown = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
    setIsDropdownExpanded(false);
    closeTimerRef.current = setTimeout(() => {
      setIsDropdownVisible(false);
      closeTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }, [clearCloseTimer]);

  const openDropdown = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
    setIsDropdownVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDropdownExpanded(true);
      });
    });
  }, [clearCloseTimer]);

  const toggleDropdown = useCallback(() => {
    if (disabled) {
      return;
    }
    if (isOpen) {
      closeDropdown();
      return;
    }
    openDropdown();
  }, [closeDropdown, disabled, isOpen, openDropdown]);

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      closeDropdown();
    },
    [closeDropdown, onChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) {
        return;
      }
      closeDropdown();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeDropdown, isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const triggerBorderClass = isOpen
    ? "border-brand-red"
    : "border-gray-200";

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
        />
      ) : null}

      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        disabled={disabled}
        onClick={toggleDropdown}
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
        <SelectChevron isOpen={isOpen} />
      </button>

      {isDropdownVisible ? (
        <ul
          id={listboxId}
          role="listbox"
          className={`${DROPDOWN_PANEL_ANCHORED_CLASS} ${dropdownPanelStateClass(isDropdownExpanded)}`}
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
        </ul>
      ) : null}
    </div>
  );
}
