import { notFound } from "next/navigation";

import { AboutHero } from "@/features/about/ui/AboutHero";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <div className="-my-10 min-h-full bg-white">
      <AboutHero copy={dictionary.about} />
    </div>
  );
}
