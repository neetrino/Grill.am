import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

type PromoItem = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
};

type HomePromotionsProps = {
  locale: Locale;
  title: string;
  subtitle?: string | null;
  bannerLabel?: string | null;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  isSignedIn: boolean;
  products: readonly PromoItem[];
};

export function HomePromotions({
  locale,
  title,
  subtitle = null,
  bannerLabel = null,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  addToCartLabel,
  isSignedIn,
  products,
}: HomePromotionsProps) {
  const hasContent = products.length > 0 || Boolean(bannerLabel);

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-base text-gray-600">{subtitle}</p>
            ) : null}
          </div>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="shrink-0 text-sm font-semibold text-gray-700 underline-offset-2 hover:underline"
          >
            {viewAllLabel}
          </AppLink>
        </div>

        {bannerLabel ? (
          <div className="mb-8 rounded-2xl bg-gray-900 px-6 py-5 text-center sm:px-8 sm:text-left">
            <p className="text-lg font-semibold text-white sm:text-xl">
              {bannerLabel}
            </p>
          </div>
        ) : null}

        {!hasContent ? (
          <p className="text-gray-600">{emptyLabel}</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 2}
                locale={locale}
                productId={product.id}
                inWishlist={product.inWishlist ?? false}
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
