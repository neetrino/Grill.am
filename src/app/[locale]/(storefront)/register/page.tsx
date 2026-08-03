import { notFound } from "next/navigation";

import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { AUTH_CARD_CLASS } from "@/features/auth/ui/auth-ui";
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

  return (
    <section className="mx-auto w-full max-w-lg py-2 sm:py-4">
      <div className={AUTH_CARD_CLASS}>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-7 sm:mb-8">
            <h1 className="text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
              <span className="text-brand-red">
                {dictionary.auth.registerTitleLead}
              </span>{" "}
              <span className="text-brand-yellow">
                {dictionary.auth.registerTitleAccent}
              </span>
            </h1>
          </div>
          <RegisterForm locale={rawLocale} dictionary={dictionary.auth} />
        </div>
      </div>
    </section>
  );
}
