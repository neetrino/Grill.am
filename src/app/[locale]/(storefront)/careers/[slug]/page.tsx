import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getEnv } from "@/config/env";
import { getActiveJobPostingBySlug } from "@/features/careers/application/queries";
import type { JobEmploymentType } from "@/features/careers/domain/job-rules";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";
import { sanitizeBlogHtml } from "@/lib/sanitize/html";

type JobPostingPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function buildJobPostingJsonLd(input: {
  locale: Locale;
  slug: string;
  title: string;
  summary?: string;
  publishedAt: string | null;
}): Record<string, string> {
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = `${appUrl}/${input.locale}/careers/${input.slug}`;

  const jsonLd: Record<string, string> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title,
    url,
    mainEntityOfPage: url,
  };

  if (input.summary) {
    jsonLd.description = input.summary;
  }

  if (input.publishedAt) {
    jsonLd.datePosted = input.publishedAt;
  }

  return jsonLd;
}

export async function generateMetadata({
  params,
}: JobPostingPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const posting = await getActiveJobPostingBySlug(rawLocale, slug);
  if (!posting) {
    return {};
  }

  const title = posting.copy.title;
  const description = posting.copy.summary;
  const canonicalPath = `/${rawLocale}/careers/${posting.copy.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
    },
  };
}

export default async function JobPostingPage({ params }: JobPostingPageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const posting = await getActiveJobPostingBySlug(rawLocale, slug);
  if (!posting) {
    notFound();
  }

  if (posting.copy.slug !== slug) {
    redirect(`/${rawLocale}/careers/${posting.copy.slug}`);
  }

  const dictionary = getDictionary(rawLocale);
  const sanitizedDescription = sanitizeBlogHtml(posting.copy.description);
  const employmentLabels = dictionary.careers.employment as Record<
    JobEmploymentType,
    string
  >;
  const jsonLd = buildJobPostingJsonLd({
    locale: rawLocale,
    slug: posting.copy.slug,
    title: posting.copy.title,
    summary: posting.copy.summary,
    publishedAt: posting.publishedAt,
  });

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href={`/${rawLocale}/careers`}
        className="text-sm text-[var(--muted)] underline-offset-2 hover:underline"
      >
        {dictionary.careers.backToList}
      </Link>

      {posting.coverUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] sm:rounded-[28px]">
          <Image
            src={posting.coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {posting.copy.title}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {employmentLabels[posting.employmentType]}
          {posting.copy.location
            ? ` · ${dictionary.careers.location}: ${posting.copy.location}`
            : ""}
        </p>
        {posting.salaryAmount != null ? (
          <p className="text-sm font-medium">
            {dictionary.careers.salary}:{" "}
            {formatMoneyAmount(
              posting.salaryAmount,
              posting.salaryCurrency,
              rawLocale,
            )}
          </p>
        ) : null}
      </header>

      <div
        className="prose max-w-none text-[var(--foreground)]"
        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
      />

      <p className="border-t pt-4 text-sm text-[var(--muted)]">
        {dictionary.careers.applyHint}{" "}
        <Link
          href={`/${rawLocale}/contact`}
          className="underline-offset-2 hover:underline"
        >
          {dictionary.nav.contact}
        </Link>
      </p>
    </article>
  );
}
