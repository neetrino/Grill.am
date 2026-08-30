import { notFound } from "next/navigation";

import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { currencies, defaultCurrency } from "@/lib/money/currency";

type CatalogLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Public catalog HTML is ISR; session/cart stay in client islands. Must be a literal. */
export const revalidate = 900;

export default async function CatalogLayout({
  children,
  params,
}: CatalogLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);

  return (
    <StorefrontShell
      locale={locale}
      dictionary={dictionary}
      currency={defaultCurrency}
      availableCurrencies={currencies}
      personalize={false}
    >
      {children}
    </StorefrontShell>
  );
}
