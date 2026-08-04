import { AppLink } from "@/components/ui/AppLink";
import { AUTH_LINK_CLASS } from "@/features/auth/ui/auth-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AuthTermsAgreementProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
  defaultChecked?: boolean;
  invalid?: boolean;
};

/** Required terms + privacy acceptance (MaMarie-style auth consent). */
export function AuthTermsAgreement({
  locale,
  dictionary,
  defaultChecked = false,
  invalid = false,
}: AuthTermsAgreementProps) {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
      <input
        required
        type="checkbox"
        name="acceptTerms"
        value="on"
        defaultChecked={defaultChecked}
        aria-invalid={invalid}
        className={`mt-0.5 size-4 shrink-0 rounded text-brand-red accent-brand-red focus:ring-brand-red/30 ${
          invalid
            ? "border-red-500 ring-2 ring-red-500/20"
            : "border-gray-300"
        }`}
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
