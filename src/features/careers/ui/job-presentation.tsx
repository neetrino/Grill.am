import {
  Clock3,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const JOB_BENEFIT_ICONS: readonly LucideIcon[] = [
  Clock3,
  UtensilsCrossed,
  TrendingUp,
];

export function jobBenefitIconAt(index: number): LucideIcon {
  return JOB_BENEFIT_ICONS[index % JOB_BENEFIT_ICONS.length] ?? Clock3;
}

export function JobMetaItem({
  icon: Icon,
  label,
  className = "text-sm",
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 text-[#8a8a8a] ${className}`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function JobBenefitTags({
  benefits,
  size = "sm",
}: {
  benefits: readonly string[];
  size?: "sm" | "md";
}) {
  const textClass = size === "md" ? "text-xs sm:text-sm" : "text-xs";

  return (
    <ul className="flex flex-wrap gap-2">
      {benefits.map((benefit, index) => {
        const Icon = jobBenefitIconAt(index);
        return (
          <li
            key={benefit}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-[#f3f3f3] px-2.5 py-1.5 font-medium text-[#4a4a4a] ${textClass}`}
          >
            <Icon
              className="size-3.5 text-[#f08a1f]"
              strokeWidth={2}
              aria-hidden
            />
            {benefit}
          </li>
        );
      })}
    </ul>
  );
}
