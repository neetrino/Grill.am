import { notFound } from "next/navigation";

import { AuthPosterShell } from "@/features/auth/ui/AuthPosterShell";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const auth = dictionary.auth;

  return (
    <AuthPosterShell
      mode="register"
      formLead={auth.registerTitleLead}
      formAccent={auth.registerTitleAccent}
    >
      <RegisterForm locale={rawLocale} dictionary={auth} />
    </AuthPosterShell>
  );
}
