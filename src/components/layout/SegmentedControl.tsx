"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  href?: string;
};

/** `sm` — compact header pills; `md` — form control matching field height. */
type SegmentedControlSize = "sm" | "md";

type SegmentedControlProps<T extends string> = {
  "aria-label": string;
  value: T;
  options: readonly SegmentedOption<T>[];
  disabled?: boolean;
  size?: SegmentedControlSize;
  /** Size each segment to its label instead of equal columns. */
  fitContent?: boolean;
  onSelect?: (value: T) => void;
  renderOption?: (args: {
    option: SegmentedOption<T>;
    selected: boolean;
    className: string;
    onClick?: () => void;
  }) => ReactNode;
};

const SIZE_OPTION_CLASS: Record<SegmentedControlSize, string> = {
  sm: "px-1.5 py-2 text-[11px]",
  md: "px-3 py-2 text-sm",
};

/** Header pills stay fully round; admin form controls follow the 15px card radius. */
const SIZE_RADIUS_CLASS: Record<SegmentedControlSize, string> = {
  sm: "rounded-full",
  md: "rounded-[15px]",
};

const INDICATOR_CLASS =
  "pointer-events-none absolute top-1 bottom-1 bg-white shadow-sm duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Pill segmented control with a sliding active indicator.
 */
export function SegmentedControl<T extends string>({
  "aria-label": ariaLabel,
  value,
  options,
  disabled = false,
  size = "sm",
  fitContent = false,
  onSelect,
  renderOption,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const count = options.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeBounds, setActiveBounds] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!fitContent) {
      return;
    }
    const container = containerRef.current;
    const active = optionRefs.current[activeIndex];
    if (!container || !active) {
      return;
    }

    const measure = (): void => {
      setActiveBounds({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeIndex, count, fitContent, size]);

  const indicatorStyle: CSSProperties | null = fitContent
    ? activeBounds
      ? { left: activeBounds.left, width: activeBounds.width }
      : null
    : {
        width: `calc((100% - 0.5rem) / ${count})`,
        left: "0.25rem",
        transform: `translateX(${activeIndex * 100}%)`,
      };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={`relative flex items-center ${SIZE_RADIUS_CLASS[size]} bg-brand-surface p-1 ${
        fitContent ? "w-fit max-w-full" : "w-full"
      }`}
    >
      {indicatorStyle ? (
        <span
          aria-hidden
          className={`${INDICATOR_CLASS} ${SIZE_RADIUS_CLASS[size]} ${
            fitContent ? "transition-[left,width]" : "transition-transform"
          }`}
          style={indicatorStyle}
        />
      ) : null}

      {options.map((option, index) => {
        const selected = option.value === value;
        const base = `relative z-[1] flex items-center justify-center ${SIZE_RADIUS_CLASS[size]} whitespace-nowrap ${
          fitContent ? "flex-none" : "flex-1"
        } ${SIZE_OPTION_CLASS[size]} transition-colors duration-300`;
        const className = selected
          ? `${base} font-bold text-brand-red`
          : `${base} font-semibold text-gray-500 hover:text-gray-800`;

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
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
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
