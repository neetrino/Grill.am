import { Phone } from "lucide-react";

import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/layout/SocialIcons";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type SiteHeaderTopBarProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

export function SiteHeaderTopBar({
  locale,
  currency,
  dictionary,
}: SiteHeaderTopBarProps) {
  return (
    <div className="relative z-20 hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{dictionary.contact.storePhone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <a
                href={dictionary.contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-pink-600"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={dictionary.contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-600"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={dictionary.contact.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-700"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <LocaleSwitcher locale={locale} label={dictionary.header.language} />
            <CurrencySwitcher
              currency={currency}
              label={dictionary.header.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
