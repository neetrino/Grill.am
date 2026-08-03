import { ChevronRight } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

type FeaturedItem = {
  id: string;
  href: string;
  title: string;
  categoryTitle?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  requiresConfiguration?: boolean;
};

type HomeFeaturedProductsProps = {
  locale: Locale;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  isSignedIn: boolean;
  products: readonly FeaturedItem[];
};

export function HomeFeaturedProducts({
  locale,
  titleLead,
  titleAccent,
  subtitle,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  addToCartLabel,
  isSignedIn,
  products,
}: HomeFeaturedProductsProps) {
  return (
    <section className="w-full overflow-hidden rounded-[30px] bg-brand-yellow-soft py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-[26px] leading-tight font-black text-brand-red uppercase sm:text-[30px] sm:leading-[1.2]">
              {titleLead}{" "}
              <span className="text-[#171717]">{titleAccent}</span>
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-6 text-[#171717]">
              {subtitle}
            </p>
          </div>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tracking-[1.4px] text-[#171717] uppercase"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </AppLink>
        </div>

        {products.length === 0 ? (
          <p className="text-[#171717]">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:gap-8">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                categoryTitle={product.categoryTitle}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 4}
                locale={locale}
                productId={product.id}
                inWishlist={product.inWishlist ?? false}
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
                requiresConfiguration={product.requiresConfiguration ?? false}
              />
            ))}
          </div>
        )}

        {products.length > 0 ? (
          <div className="mt-8 flex items-center justify-center gap-1.5 sm:mt-10">
            <span className="h-2.5 w-7 rounded-full bg-white" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(95,95,95,0.43)]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
