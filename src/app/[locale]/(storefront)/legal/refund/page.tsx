import {
  generateLegalMetadata,
  LegalPolicyPage,
} from "@/features/legal/ui/LegalPolicyPage";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  return generateLegalMetadata(params, "refund");
}

export default async function RefundPolicyPage({ params }: PageProps) {
  return <LegalPolicyPage params={params} policy="refund" />;
}
