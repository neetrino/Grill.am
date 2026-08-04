import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { CheckoutSuccessView } from "@/features/checkout/ui/CheckoutSuccessView";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultCurrency, isCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

type SuccessPageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

export default async function CheckoutSuccessPage({
  params,
}: SuccessPageProps) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const copy = dictionary.checkout.success;
  const user = await getCurrentUser();
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    notFound();
  }

  if (order.userId && user && order.userId !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  const currency = isCurrency(order.baseCurrency)
    ? order.baseCurrency
    : defaultCurrency;
  const totalFormatted = formatMoneyAmount(
    order.totalAmount,
    currency,
    locale,
  );

  return (
    <CheckoutSuccessView
      orderNumber={order.orderNumber}
      totalFormatted={totalFormatted}
      productsHref={`/${locale}/products`}
      ordersHref={user ? `/${locale}/profile/orders` : null}
      copy={copy}
    />
  );
}
