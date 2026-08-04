"use client";

import type { ReactNode } from "react";

type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  href?: string;
};

type SegmentedControlProps<T extends string> = {
  "aria-label": string;
  value: T;
  options: readonly SegmentedOption<T>[];
  disabled?: boolean;
  onSelect?: (value: T) => void;
  renderOption?: (args: {
    option: SegmentedOption<T>;
    selected: boolean;
    className: string;
    onClick?: () => void;
  }) => ReactNode;
};

/**
 * Pill segmented control with a sliding active indicator.
 */
export function SegmentedControl<T extends string>({
  "aria-label": ariaLabel,
  value,
  options,
  disabled = false,
  onSelect,
  renderOption,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const count = options.length;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative flex w-full items-center rounded-full bg-brand-surface p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          left: "0.25rem",
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => {
        const selected = option.value === value;
        const className = selected
          ? "relative z-[1] flex flex-1 items-center justify-center rounded-full px-1.5 py-2 text-[11px] font-bold text-brand-red transition-colors duration-300"
          : "relative z-[1] flex flex-1 items-center justify-center rounded-full px-1.5 py-2 text-[11px] font-semibold text-gray-500 transition-colors duration-300 hover:text-gray-800";

        if (renderOption) {
          return (
            <div key={option.value} className="contents">
              {renderOption({
                option,
                selected,
                className,
                onClick: onSelect
                  ? () => {
                      if (!selected && !disabled) {
                        onSelect(option.value);
                      }
                    }
                  : undefined,
              })}
            </div>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled || selected}
            aria-pressed={selected}
            className={className}
            onClick={() => {
              if (!selected) {
                onSelect?.(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
