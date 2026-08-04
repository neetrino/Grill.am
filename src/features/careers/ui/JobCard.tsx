import { Briefcase, ChevronRight, Flame, MapPin } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontJobListItem } from "@/features/careers/application/queries";
import { JobMetaItem } from "@/features/careers/ui/job-presentation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type JobCardCopy = Dictionary["careers"];

type JobCardProps = {
  posting: StorefrontJobListItem;
  locale: Locale;
  copy: JobCardCopy;
};

function JobCardAccent() {
  return (
    <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden bg-brand-red sm:h-auto sm:w-[120px] lg:w-[140px]">
      <Flame
        className="pointer-events-none absolute -right-6 -bottom-8 size-32 text-black/15"
        fill="currentColor"
        strokeWidth={0}
        aria-hidden
      />
      <Briefcase
        className="relative z-10 size-11 text-white sm:size-12"
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

  return (
    <article className="flex h-full overflow-hidden rounded-[20px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
        <JobCardAccent />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <span className="inline-flex w-fit items-center rounded-md bg-[#ffe5e8] px-2.5 py-1 text-xs font-semibold text-brand-red">
            {copy.openBadge}
          </span>

          <h2 className="text-lg leading-tight font-bold tracking-tight text-brand-ink sm:text-xl">
            <AppLink
              href={href}
              prefetchPolicy="auto"
              className="transition hover:text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              {posting.copy.title}
            </AppLink>
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {location ? <JobMetaItem icon={MapPin} label={location} /> : null}
            <JobMetaItem icon={Briefcase} label={employment} />
          </div>

          <AppLink
            href={href}
            prefetchPolicy="intent"
            className="mt-auto inline-flex h-10 w-fit shrink-0 items-center justify-center gap-1.5 self-end rounded-full bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
          >
            {copy.details}
            <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
          </AppLink>
        </div>
      </div>
    </article>
  );
}
