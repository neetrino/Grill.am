import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AuthPosterShell } from "@/features/auth/ui/AuthPosterShell";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const auth = dictionary.auth;

  return (
    <AuthPosterShell
      mode="login"
      formLead={auth.loginTitleLead}
      formAccent={auth.loginTitleAccent}
    >
      <Suspense fallback={<p className="text-sm text-brand-ink/50">…</p>}>
        <LoginForm locale={rawLocale} dictionary={auth} />
      </Suspense>
    </AuthPosterShell>
  );
}
