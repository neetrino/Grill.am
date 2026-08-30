import { ProductReviewsSection } from "@/features/products/ui/ProductReviewsSection";
import { getCachedPublicProductReviews } from "@/features/reviews/application/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type ProductReviewsIslandProps = {
  locale: Locale;
  productId: string;
  productSlug: string;
  dictionary: Dictionary;
};

/** Cached public reviews. Write/edit CTA personalizes on the client. */
export async function ProductReviewsIsland({
  locale,
  productId,
  productSlug,
  dictionary,
}: ProductReviewsIslandProps) {
  const reviewsView = await getCachedPublicProductReviews(productId);

  return (
    <ProductReviewsSection
      locale={locale}
      productId={productId}
      productSlug={productSlug}
      reviewsView={reviewsView}
      labels={dictionary.product}
    />
  );
}
