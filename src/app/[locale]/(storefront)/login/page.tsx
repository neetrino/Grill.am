import { Suspense } from "react";
import { notFound } from "next/navigation";

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

  return (
    <section className="mx-auto w-full max-w-lg py-2 sm:py-4">
      <div className="rounded-[15px] bg-white px-5 py-12 shadow-[0_8px_28px_rgba(0,0,0,0.08)] sm:px-7 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-12 sm:mb-14">
            <h1 className="text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
              <span className="text-brand-red">
                {dictionary.auth.loginTitleLead}
              </span>{" "}
              <span className="text-brand-yellow">
                {dictionary.auth.loginTitleAccent}
              </span>
            </h1>
          </div>
          <Suspense fallback={<p className="text-sm text-gray-500">…</p>}>
            <LoginForm locale={rawLocale} dictionary={dictionary.auth} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
