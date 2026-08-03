import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getEnv } from "@/config/env";
import { getActiveJobPostingBySlug } from "@/features/careers/application/queries";
import { JobPostingDetail } from "@/features/careers/ui/JobPostingDetail";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
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
  const jsonLd = buildJobPostingJsonLd({
    locale: rawLocale,
    slug: posting.copy.slug,
    title: posting.copy.title,
    summary: posting.copy.summary,
    publishedAt: posting.publishedAt,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobPostingDetail
        posting={posting}
        locale={rawLocale}
        copy={dictionary.careers}
        sanitizedDescription={sanitizedDescription}
      />
    </>
  );
}
