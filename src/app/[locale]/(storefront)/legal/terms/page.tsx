import {
  generateLegalMetadata,
  LegalPolicyPage,
} from "@/features/legal/ui/LegalPolicyPage";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  return generateLegalMetadata(params, "terms");
}

export default async function TermsPage({ params }: PageProps) {
  return <LegalPolicyPage params={params} policy="terms" />;
}
