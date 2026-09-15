import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";

type ProductCoinsEarnPillProps = {
  label: string;
  className?: string;
};

/** Cream “+N Coins” earn preview under product price. */
export function ProductCoinsEarnPill({
  label,
  className = "",
}: ProductCoinsEarnPillProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#FFF4D4] py-1 pr-2.5 pl-1 ${className}`}
    >
      <HeaderCoinsIcon className="size-5 shrink-0" />
      <span className="truncate text-xs font-semibold text-[#8B4513] sm:text-sm">
        {label}
      </span>
    </span>
  );
}
