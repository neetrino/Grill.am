import {
  generateLegalMetadata,
  LegalPolicyPage,
} from "@/features/legal/ui/LegalPolicyPage";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  return generateLegalMetadata(params, "privacy");
}

export default async function PrivacyPage({ params }: PageProps) {
  return <LegalPolicyPage params={params} policy="privacy" />;
}
