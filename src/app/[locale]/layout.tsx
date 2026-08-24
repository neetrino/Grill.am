import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CrispChat } from "@/components/layout/CrispChat";
import { LocaleClientProviders } from "@/components/providers/LocaleClientProviders";
import { getEnv } from "@/config/env";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createLocaleMetadata } from "@/lib/seo/site-metadata";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams(): Array<{ locale: Locale }> {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const dictionary = getDictionary(rawLocale);
  const description = `${dictionary.home.subtitle} — ${dictionary.brand}`;
  const appUrl =
    getEnv().NEXT_PUBLIC_APP_URL.trim() || "https://grill.am";

  return createLocaleMetadata(rawLocale, description, appUrl);
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const { NEXT_PUBLIC_CRISP_WEBSITE_ID } = getEnv();

  return (
    <LocaleClientProviders
      confirmDeleteLabels={{
        title: dictionary.dialogs.confirmDeleteTitle,
        message: dictionary.dialogs.confirmDeleteMessage,
        confirmText: dictionary.buttons.delete,
        cancelText: dictionary.buttons.cancel,
      }}
    >
      <div lang={locale} className="flex min-h-dvh flex-1 flex-col bg-gray-50">
        {children}
      </div>
      <CrispChat
        websiteId={NEXT_PUBLIC_CRISP_WEBSITE_ID}
        locale={locale}
        openLabel={dictionary.chat.open}
        greeting={dictionary.chat.greeting}
      />
    </LocaleClientProviders>
  );
}
