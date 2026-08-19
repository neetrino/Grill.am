import {
  parseCompositionItems,
  ProductCompositionChips,
} from "@/features/products/ui/ProductCompositionChips";
import { CatalogBreadcrumbs } from "@/features/products/ui/CatalogBreadcrumbs";
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
  ratingAverage: number | null;
  ratingCount: number | null;
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
  ratingAverage,
  ratingCount,
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
  const primaryCategory = product.categories[0] ?? null;
  const compositionItems = product.translation.composition
    ? parseCompositionItems(product.translation.composition)
    : [];

  return (
    <article className="storefront-bleed -mt-10 mb-[-2.5rem] bg-[#f2f0f0]">
      <div className="mx-auto w-full max-w-[1470px] px-4 pt-3 pb-16 sm:px-6 lg:max-w-[var(--page-max-width)] lg:px-[var(--page-padding-inline)]">
        <div className="lg:mx-auto lg:w-full lg:max-w-7xl lg:px-6">
          <CatalogBreadcrumbs
            backLabel={dictionary.catalog.back}
            backHref={`/${locale}/products`}
            backTone="accent"
            items={[
              {
                label: dictionary.nav.products,
                href: `/${locale}/products`,
              },
              ...(primaryCategory
                ? [
                    {
                      label: primaryCategory.title,
                      href: `/${locale}/products?category=${encodeURIComponent(primaryCategory.slug)}`,
                    },
                  ]
                : []),
              { label: product.translation.title },
            ]}
          />

          <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-[51px]">
            <div className="flex min-w-0 flex-col gap-[35px]">
              <ProductGallery
                images={product.images}
                title={product.translation.title}
                hitLabel={product.isFeatured ? labels.hit : null}
                inStock={inStock}
                outOfStockLabel={labels.outOfStock}
                zoomLabel={labels.zoom}
                closeZoomLabel={labels.closeZoom}
                locale={locale}
                productId={product.id}
                inWishlist={inWishlist}
                isSignedIn={isSignedIn}
                wishlistLabel={dictionary.nav.wishlist}
              />
              <ProductCompositionChips
                title={labels.composition}
                items={compositionItems}
              />
            </div>

            <ProductBuyBox
              locale={locale}
              currency={currency}
              fxRate={fxRate}
              productId={product.id}
              title={product.translation.title}
              slug={product.translation.slug}
              stockOnHand={product.stockOnHand}
              baseUnitAmount={product.priceAmount}
              compareAtAmount={product.compareAtAmount}
              initialPriceFormatted={priceFormatted}
              initialCompareAtFormatted={compareAtFormatted}
              shortDescription={product.translation.shortDescription}
              description={product.translation.description}
              imageUrl={product.images[0]?.url ?? product.imageUrl}
              customization={storefrontCustomization}
              rawCustomization={product.customization}
              ratingAverage={ratingAverage}
              ratingCount={ratingCount}
              labels={{
                quantity: labels.quantity,
                decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
                increaseQuantity: dictionary.cartDrawer.increaseQuantity,
                addToCart: labels.addToCart,
                selectRequired: labels.selectRequired,
                outOfStock: labels.outOfStock,
                added: labels.added,
                error: labels.addError,
                options: labels.options,
                addons: labels.addons,
                exclusions: labels.exclusions,
                removeModifier: labels.removeModifier,
              }}
            />
          </div>

          <div className="mt-16 md:mt-20">{relatedSlot}</div>
          <div className="mt-12">{reviewsSlot}</div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
