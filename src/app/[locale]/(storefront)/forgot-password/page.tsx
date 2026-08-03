import { notFound } from "next/navigation";

import { ForgotPasswordForm } from "@/features/auth/ui/ForgotPasswordForm";
import {
  AUTH_CARD_CLASS,
  AUTH_TITLE_CLASS,
} from "@/features/auth/ui/auth-ui";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <section className="mx-auto w-full max-w-lg py-2 sm:py-4">
      <div className={AUTH_CARD_CLASS}>
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-7 sm:mb-8">
            <h1 className={AUTH_TITLE_CLASS}>
              {dictionary.auth.forgotPasswordTitle}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {dictionary.auth.forgotPasswordSubtitle}
            </p>
          </div>
          <ForgotPasswordForm locale={rawLocale} dictionary={dictionary.auth} />
        </div>
      </div>
    </section>
  );
}
