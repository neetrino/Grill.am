import { notFound } from "next/navigation";

import { loadHasPassword } from "@/features/auth/load-has-password";
import { ChangePasswordForm } from "@/features/profile/ui/ChangePasswordForm";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PasswordPage({ params }: PasswordPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const hasPassword = await loadHasPassword(user.id);
  const dictionary = getDictionary(locale);
  const copy = dictionary.profile.passwordForm;

  return (
    <section>
      <ChangePasswordForm
        locale={locale}
        hasPassword={hasPassword}
        labels={{
          title: dictionary.profile.password,
          setTitle: copy.setTitle,
          currentPassword: copy.currentPassword,
          newPassword: copy.newPassword,
          confirmPassword: copy.confirmPassword,
          currentPasswordPlaceholder: copy.currentPasswordPlaceholder,
          newPasswordPlaceholder: copy.newPasswordPlaceholder,
          confirmPasswordPlaceholder: copy.confirmPasswordPlaceholder,
          change: copy.change,
          changing: copy.changing,
          set: copy.set,
          setting: copy.setting,
        }}
      />
    </section>
  );
}
