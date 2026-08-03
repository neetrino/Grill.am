import { notFound } from "next/navigation";

import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
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
  categoryTitle: string | null;
  priceFormatted: string;
  compareAtFormatted: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist: boolean;
  requiresConfiguration: boolean;
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
    currency,
    user,
  ] = await Promise.all([
    listActiveHeroSlides(locale),
    listStorefrontCategories(locale),
    getFeaturedProducts(locale),
    getDiscountedProducts(locale),
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

  function toCards(products: typeof featuredProducts): PricedCard[] {
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
        categoryTitle: product.categoryTitle,
        priceFormatted: price.formatted,
        compareAtFormatted: compareAt?.formatted ?? null,
        discountPercent: product.discountPercent,
        imageUrl: product.imageUrl,
        inStock: product.stockOnHand > 0,
        inWishlist: wishlistIds.has(product.id),
        requiresConfiguration: product.requiresConfiguration,
      };
    });
  }

  const featuredCards = toCards(featuredProducts);
  const promotionCards = toCards(discountedProducts);

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -my-10 overflow-x-clip bg-white">
      <HomeHero
        slides={heroSlides}
        fallbackTitle={dictionary.home.title}
        fallbackSubtitle={dictionary.home.subtitle}
        fallbackCtaLabel={dictionary.home.cta}
        fallbackCtaHref={`/${locale}/products`}
      />

      <HomeCategories
        titleLead={dictionary.home.categoriesTitleLead}
        titleAccent={dictionary.home.categoriesTitleAccent}
        subtitle={dictionary.home.categoriesSubtitle}
        viewAllLabel={dictionary.home.categoriesViewAll}
        viewAllHref={`/${locale}/products`}
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
        titleLead={dictionary.home.featuredTitleLead}
        titleAccent={dictionary.home.featuredTitleAccent}
        subtitle={dictionary.home.featuredSubtitle}
        viewAllLabel={dictionary.home.featuredViewAll}
        viewAllHref={`/${locale}/products`}
        emptyLabel={dictionary.home.emptyFeatured}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        isSignedIn={Boolean(user)}
        products={featuredCards}
      />

      <HomePromotions
        limitedOfferLabel={dictionary.home.specialLimitedOffer}
        eyebrow={dictionary.home.specialEyebrow}
        titleLead={dictionary.home.specialTitleLead}
        titleAccent={dictionary.home.specialTitleAccent}
        line1={dictionary.home.specialLine1}
        line2={dictionary.home.specialLine2}
        ctaLabel={dictionary.home.specialCta}
        ctaHref={`/${locale}/products`}
        onlyLabel={dictionary.home.specialOnly}
        wasLabel={dictionary.home.specialWas}
        saveLabel={dictionary.home.specialSave}
        freshDealLabel={dictionary.home.specialFreshDeal}
        prevLabel={dictionary.home.specialPrev}
        nextLabel={dictionary.home.specialNext}
        products={(promotionCards.length > 0
          ? promotionCards
          : featuredCards
        ).map((card, cardIndex) => {
          const source =
            (promotionCards.length > 0
              ? discountedProducts[cardIndex]
              : featuredProducts[cardIndex]) ?? null;
          const saveAmount =
            source?.compareAtAmount != null &&
            source.compareAtAmount > source.priceAmount
              ? formatPrice(source.compareAtAmount - source.priceAmount)
                  .formatted
              : null;

          return {
            title: card.title,
            href: card.href,
            priceFormatted: card.priceFormatted,
            compareAtFormatted: card.compareAtFormatted,
            imageUrl: card.imageUrl,
            saveFormatted: saveAmount,
          };
        })}
      />

      <HomeFeatures
        titleLead={dictionary.home.whyChooseTitleLead}
        titleAccent={dictionary.home.whyChooseTitleAccent}
        items={[
          {
            title: dictionary.home.features.deliveryTitle,
            description: dictionary.home.features.deliveryDescription,
            imageSrc: "/assets/home/feature-delivery.webp",
            tone: "red",
          },
          {
            title: dictionary.home.features.qualityTitle,
            description: dictionary.home.features.qualityDescription,
            imageSrc: "/assets/home/feature-fresh.webp",
            tone: "white",
          },
          {
            title: dictionary.home.features.paymentTitle,
            description: dictionary.home.features.paymentDescription,
            imageSrc: "/assets/home/feature-payment.webp",
            tone: "cream",
          },
          {
            title: dictionary.home.features.shippingTitle,
            description: dictionary.home.features.shippingDescription,
            imageSrc: "/assets/home/feature-shipping.webp",
            tone: "yellow",
          },
        ]}
      />
    </div>
  );
}
