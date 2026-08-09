"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type MobileCatalogPriceFiltersProps = {
  label: string;
  children: ReactNode;
};

/**
 * Mobile price filter — opens directly under the pill.
 * Same line: right-aligned; wrapped to next line: left-aligned.
 */
export function MobileCatalogPriceFilters({
  label,
  children,
}: MobileCatalogPriceFiltersProps) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("right");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function updateAlign(): void {
      const trigger = triggerRef.current;
      const root = rootRef.current;
      if (trigger == null || root == null) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const previous = root.previousElementSibling;
      const previousTop =
        previous instanceof HTMLElement
          ? previous.getBoundingClientRect().top
          : rect.top;
      const onNextLine = rect.top > previousTop + 4;
      setAlign(onNextLine ? "left" : "right");
    }

    updateAlign();
    window.addEventListener("resize", updateAlign);
    return () => {
      window.removeEventListener("resize", updateAlign);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setOpen(false);
    }

    function handleScroll(): void {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-30 lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`relative z-30 inline-flex h-[34px] items-center gap-2 rounded-full border border-brand-red px-4 text-sm font-semibold transition ${
          open
            ? "bg-brand-red text-white"
            : "bg-white text-[#101828] hover:bg-[#fff4ee]"
        }`}
      >
        {label}
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "rotate-180 text-white" : "rotate-0 text-brand-red"
          }`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-label={label}
        aria-hidden={!open}
        className={`absolute top-full z-40 mt-1.5 w-[min(calc(100vw-2rem),20rem)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
        } ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}
