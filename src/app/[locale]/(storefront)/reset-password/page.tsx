import { notFound } from "next/navigation";

import { ResetPasswordForm } from "@/features/auth/ui/ResetPasswordForm";
import {
  AUTH_CARD_CLASS,
  AUTH_TITLE_CLASS,
} from "@/features/auth/ui/auth-ui";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function resolveToken(raw: string | string[] | undefined): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }
  return "";
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const token = resolveToken(query.token);

  return (
    <section className="mx-auto w-full max-w-lg py-2 sm:py-4">
      <div className={AUTH_CARD_CLASS}>
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-7 sm:mb-8">
            <h1 className={AUTH_TITLE_CLASS}>
              {dictionary.auth.resetPasswordTitle}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {dictionary.auth.resetPasswordSubtitle}
            </p>
          </div>
          <ResetPasswordForm
            locale={rawLocale}
            token={token}
            dictionary={dictionary.auth}
          />
        </div>
      </div>
    </section>
  );
}
