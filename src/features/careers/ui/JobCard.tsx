import {
  Briefcase,
  ChevronRight,
  Clock3,
  Flame,
  MapPin,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontJobListItem } from "@/features/careers/application/queries";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type JobCardCopy = Dictionary["careers"];

type JobCardProps = {
  posting: StorefrontJobListItem;
  locale: Locale;
  copy: JobCardCopy;
};

const BENEFIT_ICONS: readonly LucideIcon[] = [
  Clock3,
  UtensilsCrossed,
  TrendingUp,
];

function benefitIconAt(index: number): LucideIcon {
  return BENEFIT_ICONS[index % BENEFIT_ICONS.length] ?? Clock3;
}

function JobMetaItem({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[#8a8a8a]">
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

function JobCardAccent() {
  return (
    <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden bg-brand-red sm:h-auto sm:w-[200px] lg:w-[220px]">
      <Flame
        className="pointer-events-none absolute -right-6 -bottom-8 size-36 text-black/15"
        fill="currentColor"
        strokeWidth={0}
        aria-hidden
      />
      <Briefcase
        className="relative z-10 size-14 text-white sm:size-16"
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}

export function JobCard({ posting, locale, copy }: JobCardProps) {
  const href = `/${locale}/careers/${posting.copy.slug}`;
  const employment = copy.employment[posting.employmentType];
  const location = posting.copy.location?.trim();
  const salary =
    posting.salaryAmount != null
      ? formatMoneyAmount(
          posting.salaryAmount,
          posting.salaryCurrency,
          locale,
        )
      : null;
  return (
    <article className="overflow-hidden rounded-[20px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
      <div className="flex min-h-[220px] flex-col sm:flex-row">
        <JobCardAccent />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
          <span className="inline-flex w-fit items-center rounded-md bg-[#ffe5e8] px-2.5 py-1 text-xs font-semibold text-brand-red">
            {copy.openBadge}
          </span>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl leading-tight font-bold tracking-tight text-brand-ink">
              <AppLink
                href={href}
                prefetchPolicy="auto"
                className="transition hover:text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
              >
                {posting.copy.title}
              </AppLink>
            </h2>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {location ? (
                <JobMetaItem icon={MapPin} label={location} />
              ) : null}
              <JobMetaItem icon={Briefcase} label={employment} />
              {salary ? <JobMetaItem icon={Tag} label={salary} /> : null}
            </div>
          </div>

          {posting.copy.summary ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[#5c5c5c]">
              {posting.copy.summary}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
            <ul className="flex flex-wrap gap-2">
              {copy.benefits.map((benefit, index) => {
                const Icon = benefitIconAt(index);
                return (
                  <li
                    key={benefit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f3f3] px-2.5 py-1.5 text-xs font-medium text-[#4a4a4a]"
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

            <AppLink
              href={href}
              prefetchPolicy="intent"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 self-end rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              {copy.apply}
              <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
            </AppLink>
          </div>
        </div>
      </div>
    </article>
  );
}
