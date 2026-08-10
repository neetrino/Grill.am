import { notFound } from "next/navigation";

import { listActiveJobPostings } from "@/features/careers/application/queries";
import { JobCard } from "@/features/careers/ui/JobCard";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type CareersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CareersPage({ params }: CareersPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const postings = await listActiveJobPostings(rawLocale);

  return (
    <div className="-my-10 min-h-full bg-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-12">
        <h1 className="text-[26px] leading-tight font-black text-brand-yellow uppercase sm:text-[30px] sm:leading-[1.2]">
          {dictionary.careers.title}
        </h1>

        {postings.length === 0 ? (
          <p className="text-[var(--muted)]">{dictionary.careers.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {postings.map((posting) => (
              <JobCard
                key={posting.id}
                posting={posting}
                locale={rawLocale}
                copy={dictionary.careers}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
