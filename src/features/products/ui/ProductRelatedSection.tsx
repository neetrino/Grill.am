import { ChevronRight } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import { getRelatedProducts } from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { defaultCurrency, type Currency } from "@/lib/money/currency";
import { formatBaseCatalogPrice } from "@/lib/money/catalog-price";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";

type ProductRelatedSectionProps = {
  locale: Locale;
  productId: string;
  categorySlug?: string | null;
  currency: Currency;
  isSignedIn: boolean;
  dictionary: Dictionary;
};

/** Streams below the PDP fold — does not block gallery/purchase chrome. */
export async function ProductRelatedSection({
  locale,
  productId,
  categorySlug,
  currency,
  isSignedIn,
  dictionary,
}: ProductRelatedSectionProps) {
  const related = await getRelatedProducts(locale, productId);
  if (related.length === 0) {
    return null;
  }

  const [wishlistIds, formatPrice] = await Promise.all([
    isSignedIn
      ? getWishlistProductIds(related.map((item) => item.id))
      : Promise.resolve(new Set<string>()),
    currency === defaultCurrency
      ? Promise.resolve((amount: number) =>
          formatBaseCatalogPrice(amount, locale),
        )
      : createDisplayPriceFormatter(locale, currency),
  ]);

  const labels = dictionary.product;
  const viewAllHref = categorySlug
    ? `/${locale}/products?category=${encodeURIComponent(categorySlug)}`
    : `/${locale}/products`;

  return (
    <section className="flex flex-col gap-[30px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <h2 className="min-w-0 text-[28px] leading-tight font-black text-brand-red uppercase sm:text-[40px] sm:leading-[58.8px]">
          {labels.relatedTitleLead}{" "}
          <span className="text-[#171717]">{labels.relatedTitleAccent}</span>
        </h2>
        <AppLink
          href={viewAllHref}
          prefetchPolicy="intent"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tracking-[1.4px] text-[#171717] uppercase"
        >
          {dictionary.home.viewAll}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </AppLink>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {related.map((item) => {
          const price = formatPrice(item.priceAmount);
          const compareAt =
            item.compareAtAmount != null
              ? formatPrice(item.compareAtAmount)
              : null;

          return (
            <ProductCard
              key={item.id}
              href={`/${locale}/products/${item.translation.slug}`}
              title={item.translation.title}
              categoryTitle={item.categoryTitle}
              priceFormatted={price.formatted}
              unitPriceAmount={Number(price.displayAmount)}
              compareAtFormatted={compareAt?.formatted ?? null}
              discountPercent={item.discountPercent}
              imageUrl={item.imageUrl}
              inStock={item.stockOnHand > 0}
              priority={false}
              locale={locale}
              currency={currency}
              productId={item.id}
              inWishlist={wishlistIds.has(item.id)}
              isSignedIn={isSignedIn}
              wishlistLabel={dictionary.nav.wishlist}
              addToCartLabel={labels.addToCart}
              requiresConfiguration={item.requiresConfiguration}
              hitLabel={item.isFeatured ? labels.hit : null}
            />
          );
        })}
      </div>
    </section>
  );
}
