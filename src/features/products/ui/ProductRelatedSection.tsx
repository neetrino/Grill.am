import { ChevronRight } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import { getRelatedProducts } from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";
import type { Currency } from "@/lib/money/currency";

type ProductRelatedSectionProps = {
  locale: Locale;
  productId: string;
  currency: Currency;
  isSignedIn: boolean;
  dictionary: Dictionary;
};

/** Streams below the PDP fold — does not block gallery/purchase chrome. */
export async function ProductRelatedSection({
  locale,
  productId,
  currency,
  isSignedIn,
  dictionary,
}: ProductRelatedSectionProps) {
  const related = await getRelatedProducts(locale, productId);
  if (related.length === 0) {
    return null;
  }

  const [wishlistIds, formatPrice] = await Promise.all([
    getWishlistProductIds(related.map((item) => item.id)),
    createDisplayPriceFormatter(locale, currency),
  ]);

  const labels = dictionary.product;
  const home = dictionary.home;

  return (
    <section className="flex flex-col gap-[30px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className="text-[28px] leading-tight font-black text-brand-red uppercase sm:text-[40px] sm:leading-[58.8px]">
            {home.featuredTitleLead}{" "}
            <span className="text-[#171717]">{home.featuredTitleAccent}</span>
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-6 text-[#171717]">
            {home.featuredSubtitle}
          </p>
        </div>
        <AppLink
          href={`/${locale}/products`}
          prefetchPolicy="intent"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tracking-[1.4px] text-[#171717] uppercase"
        >
          {home.featuredViewAll}
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
              compareAtFormatted={compareAt?.formatted ?? null}
              discountPercent={item.discountPercent}
              imageUrl={item.imageUrl}
              inStock={item.stockOnHand > 0}
              priority={false}
              locale={locale}
              productId={item.id}
              inWishlist={wishlistIds.has(item.id)}
              isSignedIn={isSignedIn}
              wishlistLabel={dictionary.nav.wishlist}
              addToCartLabel={labels.addToCart}
              requiresConfiguration={item.requiresConfiguration}
            />
          );
        })}
      </div>
    </section>
  );
}
