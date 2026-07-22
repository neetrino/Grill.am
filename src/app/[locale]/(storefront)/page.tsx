import { notFound } from "next/navigation";

import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import { HomeAboutTeaser } from "@/features/home/ui/HomeAboutTeaser";
import { HomeCategories } from "@/features/home/ui/HomeCategories";
import { HomeFeaturedProducts } from "@/features/home/ui/HomeFeaturedProducts";
import { HomeFeatures } from "@/features/home/ui/HomeFeatures";
import { HomeHero } from "@/features/home/ui/HomeHero";
import { HomePromotions } from "@/features/home/ui/HomePromotions";
import { listActiveHeroSlides } from "@/features/hero/application/queries";
import {
  getDiscountedProducts,
  getFeaturedProducts,
} from "@/features/products/queries";
import { getStoreGlobalDiscount } from "@/features/settings/application/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

type PricedCard = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist: boolean;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const [
    heroSlides,
    categories,
    featuredProducts,
    discountedProducts,
    globalDiscount,
    currency,
    user,
  ] = await Promise.all([
    listActiveHeroSlides(locale),
    listStorefrontCategories(locale),
    getFeaturedProducts(locale),
    getDiscountedProducts(locale),
    getStoreGlobalDiscount(),
    getSelectedCurrency(),
    getCurrentUser(),
  ]);

  const wishlistProductIds = [
    ...new Set([
      ...featuredProducts.map((product) => product.id),
      ...discountedProducts.map((product) => product.id),
    ]),
  ];

  const [wishlistIds, formatPrice] = await Promise.all([
    getWishlistProductIds(wishlistProductIds),
    createDisplayPriceFormatter(locale, currency),
  ]);

  function toCards(
    products: typeof featuredProducts,
  ): PricedCard[] {
    return products.map((product) => {
      const price = formatPrice(product.priceAmount);
      const compareAt =
        product.compareAtAmount != null
          ? formatPrice(product.compareAtAmount)
          : null;

      return {
        id: product.id,
        href: `/${locale}/products/${product.translation.slug}`,
        title: product.translation.title,
        priceFormatted: price.formatted,
        compareAtFormatted: compareAt?.formatted ?? null,
        discountPercent: product.discountPercent,
        imageUrl: product.imageUrl,
        inStock: product.stockOnHand > 0,
        inWishlist: wishlistIds.has(product.id),
      };
    });
  }

  const featuredCards = toCards(featuredProducts);
  const promotionCards = toCards(discountedProducts);
  const bannerLabel =
    globalDiscount.percentage != null
      ? dictionary.home.promotionsBanner.replace(
          "{percent}",
          String(globalDiscount.percentage),
        )
      : null;

  return (
    <div className="-mx-4 -my-10 sm:-mx-6 lg:-mx-8">
      <HomeHero
        slides={heroSlides}
        fallbackTitle={dictionary.home.title}
        fallbackSubtitle={dictionary.home.subtitle}
        fallbackCtaLabel={dictionary.home.cta}
        fallbackCtaHref={`/${locale}/products`}
      />

      <HomeCategories
        title={dictionary.home.categoriesTitle}
        emptyLabel={dictionary.home.emptyCategories}
        categories={categories.map((category) => ({
          id: category.id,
          href: `/${locale}/products?category=${encodeURIComponent(category.slug)}`,
          title: category.title,
          imageUrl: category.imageUrl,
        }))}
      />

      <HomeFeaturedProducts
        locale={locale}
        title={dictionary.home.featuredTitle}
        viewAllLabel={dictionary.home.viewAll}
        viewAllHref={`/${locale}/products`}
        emptyLabel={dictionary.home.emptyFeatured}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        isSignedIn={Boolean(user)}
        products={featuredCards}
      />

      <HomePromotions
        locale={locale}
        title={dictionary.home.promotionsTitle}
        subtitle={dictionary.home.promotionsSubtitle}
        bannerLabel={bannerLabel}
        viewAllLabel={dictionary.home.viewAll}
        viewAllHref={`/${locale}/products`}
        emptyLabel={dictionary.home.emptyPromotions}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        isSignedIn={Boolean(user)}
        products={promotionCards}
      />

      <HomeFeatures
        title={dictionary.home.whyChooseTitle}
        items={[
          {
            title: dictionary.home.features.deliveryTitle,
            description: dictionary.home.features.deliveryDescription,
          },
          {
            title: dictionary.home.features.qualityTitle,
            description: dictionary.home.features.qualityDescription,
          },
          {
            title: dictionary.home.features.returnTitle,
            description: dictionary.home.features.returnDescription,
          },
          {
            title: dictionary.home.features.supportTitle,
            description: dictionary.home.features.supportDescription,
          },
        ]}
      />

      <HomeAboutTeaser
        eyebrow={dictionary.home.aboutEyebrow}
        title={dictionary.home.aboutTitle}
        description={dictionary.home.aboutDescription}
        ctaLabel={dictionary.home.aboutCta}
        ctaHref={`/${locale}/about`}
      />
    </div>
  );
}
