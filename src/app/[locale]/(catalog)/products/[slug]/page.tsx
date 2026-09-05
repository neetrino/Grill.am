import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getEnv } from "@/config/env";
import { listProductStaticParams } from "@/features/products/application/list-product-static-params";
import { getProductDetailBySlug } from "@/features/products/queries";
import { ProductDetailView } from "@/features/products/ui/ProductDetailView";
import { ProductRelatedSection } from "@/features/products/ui/ProductRelatedSection";
import { ProductReviewsIsland } from "@/features/products/ui/ProductReviewsIsland";
import { getCachedPublicProductReviews } from "@/features/reviews/application/queries";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultCurrency } from "@/lib/money/currency";
import { formatBaseCatalogPrice } from "@/lib/money/catalog-price";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Shared public PDP HTML — no session/currency cookies.
 * `false` = keep until tag/path invalidation. A 15-minute timer plus
 * full-catalog prerender billed an ISR write on every bot hit and deploy.
 * Must be a literal — Next cannot analyze an imported constant.
 */
export const revalidate = false;

/** First visitor generates the page; later hits are CDN/ISR reads. */
export const dynamicParams = true;

export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  return listProductStaticParams();
}

function buildProductJsonLd(input: {
  locale: Locale;
  slug: string;
  title: string;
  description?: string;
  sku: string;
  priceAmount: number;
  imageUrl: string | null;
  inStock: boolean;
}): Record<string, unknown> {
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = `${appUrl}/${input.locale}/products/${input.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    sku: input.sku,
    url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "AMD",
      price: String(input.priceAmount),
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

function SectionFallback() {
  return (
    <div
      className="h-40 animate-pulse rounded-lg bg-gray-100"
      aria-hidden="true"
    />
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const product = await getProductDetailBySlug(rawLocale, slug);
  if (!product) {
    return {};
  }

  const title = product.translation.seoTitle ?? product.translation.title;
  const description =
    product.translation.seoDescription ?? product.translation.description;
  const canonicalPath = `/${rawLocale}/products/${product.translation.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const product = await getProductDetailBySlug(locale, slug);
  if (!product) {
    notFound();
  }

  const reviewsView = await getCachedPublicProductReviews(product.id);
  const displayPrice = formatBaseCatalogPrice(product.priceAmount, locale);
  const compareAt =
    product.compareAtAmount != null
      ? formatBaseCatalogPrice(product.compareAtAmount, locale)
      : null;

  const jsonLd = buildProductJsonLd({
    locale,
    slug: product.translation.slug,
    title: product.translation.title,
    description:
      product.translation.shortDescription ?? product.translation.description,
    sku: product.sku,
    priceAmount: product.priceAmount,
    imageUrl: product.images[0]?.url ?? product.imageUrl,
    inStock: product.stockOnHand > 0,
  });

  const ratingAverage =
    reviewsView.aggregate.count > 0 ? reviewsView.aggregate.average : null;
  const ratingCount =
    reviewsView.aggregate.count > 0 ? reviewsView.aggregate.count : null;

  return (
    <ProductDetailView
      locale={locale}
      currency={defaultCurrency}
      fxRate={displayPrice.rate}
      product={product}
      priceFormatted={displayPrice.formatted}
      compareAtFormatted={compareAt?.formatted ?? null}
      isSignedIn={false}
      inWishlist={false}
      ratingAverage={ratingAverage}
      ratingCount={ratingCount}
      dictionary={dictionary}
      jsonLd={jsonLd}
      relatedSlot={
        <Suspense fallback={<SectionFallback />}>
          <ProductRelatedSection
            locale={locale}
            productId={product.id}
            categorySlug={product.categories[0]?.slug ?? null}
            currency={defaultCurrency}
            isSignedIn={false}
            dictionary={dictionary}
          />
        </Suspense>
      }
      reviewsSlot={
        <Suspense fallback={<SectionFallback />}>
          <ProductReviewsIsland
            locale={locale}
            productId={product.id}
            productSlug={product.translation.slug}
            dictionary={dictionary}
          />
        </Suspense>
      }
    />
  );
}
