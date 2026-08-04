import { AppLink } from "@/components/ui/AppLink";
import { AUTH_LINK_CLASS } from "@/features/auth/ui/auth-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AuthTermsAgreementProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

/** Required terms + privacy acceptance (MaMarie-style auth consent). */
export function AuthTermsAgreement({
  locale,
  dictionary,
}: AuthTermsAgreementProps) {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
      <input
        required
        type="checkbox"
        name="acceptTerms"
        value="on"
        className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-brand-red accent-brand-red focus:ring-brand-red/30"
      />
      <span>
        {dictionary.agreePrefix}{" "}
        <AppLink
          href={`/${locale}/legal/terms`}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {dictionary.agreeTerms}
        </AppLink>{" "}
        {dictionary.agreeAnd}{" "}
        <AppLink
          href={`/${locale}/legal/privacy`}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {dictionary.agreePrivacy}
        </AppLink>
      </span>
    </label>
  );
}
