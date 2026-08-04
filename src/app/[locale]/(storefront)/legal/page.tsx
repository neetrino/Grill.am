import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPoliciesHub } from "@/features/legal/ui/LegalPoliciesHub";
import type { LegalPolicyKey } from "@/features/legal/ui/LegalPolicyPage";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const POLICY_KEYS: LegalPolicyKey[] = [
  "privacy",
  "terms",
  "delivery",
  "refund",
];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const dictionary = getDictionary(rawLocale);
  return {
    title: dictionary.legal.hubTitle,
    description: dictionary.legal.hubIntro,
  };
}

export default async function LegalHubPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const policies = POLICY_KEYS.map((key) => ({
    key,
    copy: dictionary.legal[key],
  }));

  return (
    <div className="-mx-4 -my-10 min-h-full bg-[#f2f0f0] sm:-mx-6 lg:-mx-8">
      <LegalPoliciesHub
        title={dictionary.legal.hubTitle}
        lastUpdatedLabel={dictionary.legal.lastUpdatedLabel}
        closeLabel={dictionary.close}
        policies={policies}
      />
    </div>
  );
}
