import Image from "next/image";
import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { listActiveJobPostings } from "@/features/careers/application/queries";
import type { JobEmploymentType } from "@/features/careers/domain/job-rules";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type CareersPageProps = {
  params: Promise<{ locale: string }>;
};

function employmentLabel(
  type: JobEmploymentType,
  labels: Record<JobEmploymentType, string>,
): string {
  return labels[type];
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const postings = await listActiveJobPostings(rawLocale);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.careers.title}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{dictionary.careers.subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {postings.map((posting) => (
          <article
            key={posting.id}
            className="flex flex-col gap-4 border p-4 sm:flex-row"
          >
            {posting.coverUrl ? (
              <AppLink
                href={`/${rawLocale}/careers/${posting.copy.slug}`}
                prefetchPolicy="auto"
                className="relative block h-40 w-full shrink-0 overflow-hidden sm:h-28 sm:w-40"
              >
                <Image
                  src={posting.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 160px"
                  className="object-cover"
                />
              </AppLink>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-medium">
                <AppLink
                  href={`/${rawLocale}/careers/${posting.copy.slug}`}
                  prefetchPolicy="auto"
                  className="underline-offset-2 hover:underline"
                >
                  {posting.copy.title}
                </AppLink>
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {employmentLabel(
                  posting.employmentType,
                  dictionary.careers.employment,
                )}
                {posting.copy.location ? ` · ${posting.copy.location}` : ""}
                {posting.salaryAmount != null
                  ? ` · ${formatMoneyAmount(posting.salaryAmount, posting.salaryCurrency, rawLocale)}`
                  : ""}
              </p>
              {posting.copy.summary ? (
                <p className="mt-2 text-[var(--muted)]">{posting.copy.summary}</p>
              ) : null}
            </div>
          </article>
        ))}
        {postings.length === 0 ? (
          <p className="text-[var(--muted)]">{dictionary.careers.empty}</p>
        ) : null}
      </div>
    </section>
  );
}
