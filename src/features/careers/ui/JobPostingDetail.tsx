import { Briefcase, ChevronLeft, MapPin, Tag } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontJobPosting } from "@/features/careers/application/queries";
import { JobApplySection } from "@/features/careers/ui/JobApplySection";
import {
  JobBenefitTags,
  JobMetaItem,
} from "@/features/careers/ui/job-presentation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type JobPostingDetailProps = {
  posting: StorefrontJobPosting;
  locale: Locale;
  copy: Dictionary["careers"];
  closeLabel: string;
  cancelLabel: string;
  sanitizedDescription: string;
};

export function JobPostingDetail({
  posting,
  locale,
  copy,
  closeLabel,
  cancelLabel,
  sanitizedDescription,
}: JobPostingDetailProps) {
  const careersHref = `/${locale}/careers`;
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
  const hasCover = Boolean(posting.coverUrl);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
      <AppLink
        href={careersHref}
        prefetchPolicy="intent"
        className="inline-flex w-fit items-center gap-1.5 text-base font-medium text-brand-red transition hover:opacity-80"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        {copy.backToList}
      </AppLink>

      <div
        className={
          hasCover
            ? "flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 xl:gap-12"
            : "flex flex-col gap-8"
        }
      >
        <div
          className={`flex min-w-0 flex-col gap-5 ${hasCover ? "lg:w-1/2" : ""}`}
        >
          <header className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center rounded-md bg-[#ffe5e8] px-2.5 py-1 text-xs font-semibold text-brand-red">
              {copy.openBadge}
            </span>

            <div className="flex flex-col gap-3">
              <h1 className="text-[28px] leading-tight font-black tracking-tight text-brand-ink sm:text-[36px] lg:text-[40px]">
                {posting.copy.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {location ? (
                  <JobMetaItem
                    icon={MapPin}
                    label={location}
                    className="text-sm sm:text-base"
                  />
                ) : null}
                <JobMetaItem
                  icon={Briefcase}
                  label={employment}
                  className="text-sm sm:text-base"
                />
                {salary ? (
                  <JobMetaItem
                    icon={Tag}
                    label={salary}
                    className="text-sm sm:text-base"
                  />
                ) : null}
              </div>
            </div>

            {posting.copy.summary ? (
              <p className="text-base leading-7 text-[#5c5c5c] sm:text-[17px] sm:leading-8">
                {posting.copy.summary}
              </p>
            ) : null}

            <JobBenefitTags benefits={copy.benefits} size="md" />
          </header>

          <div
            className="prose max-w-none text-base leading-7 text-[#2a2a2a] sm:text-[17px] sm:leading-8 prose-headings:font-bold prose-headings:text-brand-ink prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-strong:text-brand-ink"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        </div>

        {posting.coverUrl ? (
          <div className="relative w-full shrink-0 pt-[66%] lg:min-h-[420px] lg:w-1/2 lg:pt-0">
            <div className="absolute inset-0 overflow-hidden rounded-[24px] bg-[#f3f3f3] shadow-[0_8px_28px_rgba(0,0,0,0.08)] sm:rounded-[28px]">
              <Image
                src={posting.coverUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        ) : null}
      </div>

      <JobApplySection
        jobPostingId={posting.id}
        jobTitle={posting.copy.title}
        applyLabel={copy.apply}
        applyHint={copy.applyHint}
        closeLabel={closeLabel}
        cancelLabel={cancelLabel}
        copy={copy.applyForm}
      />
    </article>
  );
}
