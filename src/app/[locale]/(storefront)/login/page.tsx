import { Suspense } from "react";
import { notFound } from "next/navigation";

import { isCoinsAuthEntry } from "@/features/auth/guest-coins-login";
import { AuthPosterShell } from "@/features/auth/ui/AuthPosterShell";
import { LoginCoinsInfoCard } from "@/features/auth/ui/LoginCoinsInfoCard";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const auth = dictionary.auth;
  const fromCoins = isCoinsAuthEntry(query.from);

  return (
    <AuthPosterShell
      mode="login"
      formLead={auth.loginTitleLead}
      formAccent={auth.loginTitleAccent}
      showCoins={fromCoins}
      aside={fromCoins ? <LoginCoinsInfoCard copy={auth.coinsGate} /> : null}
    >
      <Suspense fallback={<p className="text-sm text-brand-ink/50">…</p>}>
        <LoginForm locale={rawLocale} dictionary={auth} />
      </Suspense>
    </AuthPosterShell>
  );
}
