import Link from "next/link";

import { toStorefrontCustomization } from "@/features/products/domain/customization";
import { ProductBuyBox } from "@/features/products/ui/ProductBuyBox";
import { ProductGallery } from "@/features/products/ui/ProductGallery";
import type { ProductDetail } from "@/features/products/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type ProductDetailViewProps = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  product: ProductDetail;
  priceFormatted: string;
  compareAtFormatted: string | null;
  isSignedIn: boolean;
  inWishlist: boolean;
  dictionary: Dictionary;
  jsonLd: Record<string, unknown>;
  relatedSlot: React.ReactNode;
  reviewsSlot: React.ReactNode;
};

export function ProductDetailView({
  locale,
  currency,
  fxRate,
  product,
  priceFormatted,
  compareAtFormatted,
  isSignedIn,
  inWishlist,
  dictionary,
  jsonLd,
  relatedSlot,
  reviewsSlot,
}: ProductDetailViewProps) {
  const labels = dictionary.product;
  const inStock = product.stockOnHand > 0;
  const storefrontCustomization = toStorefrontCustomization(
    product.customization,
    locale,
  );

  return (
    <article className="flex flex-col gap-16 md:gap-20">
      <p className="text-sm text-gray-600">
        <Link
          href={`/${locale}/products`}
          className="font-medium text-gray-900 underline-offset-2 hover:underline"
        >
          {labels.backToProducts}
        </Link>
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={product.images}
          title={product.translation.title}
          discountPercent={product.discountPercent}
          inStock={inStock}
          outOfStockLabel={labels.outOfStock}
          zoomLabel={labels.zoom}
          closeZoomLabel={labels.closeZoom}
        />

        <div className="flex flex-col gap-6 lg:min-h-full">
          {product.categories.length > 0 ? (
            <p className="text-sm font-medium text-gray-500">
              {product.categories.map((category) => category.title).join(" · ")}
            </p>
          ) : null}

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {product.translation.title}
          </h1>

          <ProductBuyBox
            locale={locale}
            currency={currency}
            fxRate={fxRate}
            productId={product.id}
            sku={product.sku}
            stockOnHand={product.stockOnHand}
            baseUnitAmount={product.priceAmount}
            compareAtAmount={product.compareAtAmount}
            discountPercent={product.discountPercent}
            initialPriceFormatted={priceFormatted}
            initialCompareAtFormatted={compareAtFormatted}
            shortDescription={product.translation.shortDescription}
            composition={product.translation.composition}
            description={product.translation.description}
            customization={storefrontCustomization}
            rawCustomization={product.customization}
            inWishlist={inWishlist}
            isSignedIn={isSignedIn}
            wishlistLabel={dictionary.nav.wishlist}
            labels={{
              quantity: labels.quantity,
              decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
              increaseQuantity: dictionary.cartDrawer.increaseQuantity,
              addToCart: labels.addToCart,
              adding: labels.adding,
              outOfStock: labels.outOfStock,
              added: labels.added,
              error: labels.addError,
              shortDescription: labels.shortDescription,
              composition: labels.composition,
              options: labels.options,
              addons: labels.addons,
              exclusions: labels.exclusions,
              selectAddon: labels.selectAddon,
              selectExclusion: labels.selectExclusion,
              removeModifier: labels.removeModifier,
              inStock: labels.inStock,
              sku: labels.sku,
            }}
          />
        </div>
      </div>

      {relatedSlot}
      {reviewsSlot}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
