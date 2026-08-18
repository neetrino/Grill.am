import { notFound } from "next/navigation";

import { TidioChat } from "@/components/layout/TidioChat";
import { LocaleClientProviders } from "@/components/providers/LocaleClientProviders";
import { getEnv } from "@/config/env";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams(): Array<{ locale: Locale }> {
  return locales.map((locale) => ({ locale }));
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
  const { NEXT_PUBLIC_TIDIO_PUBLIC_KEY, NEXT_PUBLIC_CRISP_WEBSITE_ID } =
    getEnv();

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
      <TidioChat
        publicKey={NEXT_PUBLIC_TIDIO_PUBLIC_KEY}
        crispWebsiteId={NEXT_PUBLIC_CRISP_WEBSITE_ID}
        locale={locale}
        openLabel={dictionary.chat.open}
      />
    </LocaleClientProviders>
  );
}
