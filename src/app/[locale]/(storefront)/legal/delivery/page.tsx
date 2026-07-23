import {
  generateLegalMetadata,
  LegalPolicyPage,
} from "@/features/legal/ui/LegalPolicyPage";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  return generateLegalMetadata(params, "delivery");
}

export default async function DeliveryPolicyPage({ params }: PageProps) {
  return <LegalPolicyPage params={params} policy="delivery" />;
}
