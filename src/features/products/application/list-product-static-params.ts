import { getActiveProducts } from "@/features/products/queries";
import { locales } from "@/lib/i18n/config";

export function canPrerenderProductParams(
  databaseUrl: string | undefined,
): boolean {
  return Boolean(databaseUrl?.trim());
}

/**
 * PDP `generateStaticParams`. Returns no paths when the DB is not configured
 * (CI unit build) so `next build` does not throw. Vercel still prerenders.
 */
export async function listProductStaticParams(): Promise<
  Array<{ locale: string; slug: string }>
> {
  if (!canPrerenderProductParams(process.env.DATABASE_URL)) {
    return [];
  }

  try {
    const perLocale = await Promise.all(
      locales.map(async (locale) => {
        const products = await getActiveProducts(locale);
        return products.flatMap((product) => {
          const slug = product.translation.slug;
          return slug ? [{ locale, slug }] : [];
        });
      }),
    );
    return perLocale.flat();
  } catch {
    return [];
  }
}
