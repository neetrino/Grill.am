import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";

type ProductCoinsEarnPillProps = {
  label: string;
  className?: string;
  /**
   * Product cards: hide the trailing word (e.g. “Coins”) below `sm`.
   * PDP can keep the full label.
   */
  compactOnMobile?: boolean;
};

function splitEarnLabel(label: string): { amount: string; rest: string } {
  const match = /^(\+\S+)(\s+.*)?$/u.exec(label.trim());
  if (!match) {
    return { amount: label, rest: "" };
  }
  return { amount: match[1] ?? label, rest: match[2] ?? "" };
}

/** Cream “+N Coins” earn preview under product price. */
export function ProductCoinsEarnPill({
  label,
  className = "",
  compactOnMobile = false,
}: ProductCoinsEarnPillProps) {
  const { amount, rest } = splitEarnLabel(label);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#FFF4D4] py-1 pr-2.5 pl-1 ${className}`}
    >
      <HeaderCoinsIcon className="size-5 shrink-0" />
      <span className="truncate text-xs font-semibold text-[#8B4513] sm:text-sm">
        {amount}
        {rest ? (
          <span className={compactOnMobile ? "hidden sm:inline" : undefined}>
            {rest}
          </span>
        ) : null}
      </span>
    </span>
  );
}
