import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LegalDocumentView } from "@/features/legal/ui/LegalDocumentView";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export type LegalPolicyKey = "privacy" | "terms" | "refund" | "delivery";

type LegalPageParams = Promise<{ locale: string }>;

function resolveLocale(rawLocale: string): Locale {
  if (!isLocale(rawLocale)) {
    notFound();
  }
  return rawLocale;
}

export async function generateLegalMetadata(
  params: LegalPageParams,
  policy: LegalPolicyKey,
): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.legal[policy];

  return {
    title: copy.title,
    description: copy.intro,
  };
}

export async function LegalPolicyPage({
  params,
  policy,
}: {
  params: LegalPageParams;
  policy: LegalPolicyKey;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.legal[policy];

  return (
    <div className="-mx-4 -my-10 bg-white sm:-mx-6 lg:-mx-8">
      <LegalDocumentView
        copy={copy}
        lastUpdatedLabel={dictionary.legal.lastUpdatedLabel}
      />
    </div>
  );
}
