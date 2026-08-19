import { notFound } from "next/navigation";

import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import { listStorefrontNavCategories } from "@/features/categories/application/list-storefront-nav-categories";
import { findComboCategory } from "@/features/categories/domain/combo-category";
import { HomeCategories } from "@/features/home/ui/HomeCategories";
import { HomeHero } from "@/features/home/ui/HomeHero";
import {
  HomeBranchesLazy,
  HomeFeaturedProductsLazy,
  HomeFeaturesLazy,
  HomePromotionsLazy,
} from "@/features/home/ui/lazy-home-sections";
import { listActiveHeroSlides } from "@/features/hero/application/queries";
import { getFeaturedProducts } from "@/features/products/queries";
import {
  fallbackStorefrontBranches,
  toHomeBranchItems,
} from "@/features/stores/application/home-branches";
import { listStorefrontBranches } from "@/features/stores/application/queries";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
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
  unitPriceAmount: number;
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
    navCategories,
    featuredProducts,
    currency,
    user,
    cmsBranches,
  ] = await Promise.all([
    listActiveHeroSlides(locale),
    listStorefrontCategories(locale),
    listStorefrontNavCategories(locale),
    getFeaturedProducts(locale),
    getSelectedCurrency(),
    getCurrentUser(),
    listStorefrontBranches(locale),
  ]);

  const wishlistProductIds = featuredProducts.map((product) => product.id);

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
        unitPriceAmount: Number(price.displayAmount),
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
  const comboCategory = findComboCategory(navCategories);
  const combosHref = comboCategory
    ? `/${locale}/products?category=${encodeURIComponent(comboCategory.slug)}`
    : `/${locale}/products`;

  return (
    <div className="storefront-bleed -my-10 overflow-x-clip bg-white">
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

      <HomeFeaturedProductsLazy
        locale={locale}
        currency={currency}
        titleLead={dictionary.home.featuredTitleLead}
        titleAccent={dictionary.home.featuredTitleAccent}
        viewAllLabel={dictionary.home.featuredViewAll}
        viewAllHref={`/${locale}/products`}
        emptyLabel={dictionary.home.emptyFeatured}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        isSignedIn={Boolean(user)}
        products={featuredCards}
      />

      <HomePromotionsLazy
        limitedOfferLabel={dictionary.home.specialLimitedOffer}
        eyebrow={dictionary.home.specialEyebrow}
        titleLead={dictionary.home.specialTitleLead}
        titleAccent={dictionary.home.specialTitleAccent}
        line1={dictionary.home.specialLine1}
        line2={dictionary.home.specialLine2}
        ctaLabel={dictionary.home.specialCta}
        ctaHref={combosHref}
      />

      <HomeBranchesLazy
        title={dictionary.stores.branchesTitle}
        viewAllLabel={dictionary.stores.viewAll}
        viewAllHref={`/${locale}/stores`}
        previousLabel={dictionary.stores.previous}
        nextLabel={dictionary.stores.next}
        branches={toHomeBranchItems(
          locale,
          cmsBranches.length > 0
            ? cmsBranches
            : fallbackStorefrontBranches(locale),
          dictionary.contact.storePhones[0] ?? "",
        )}
      />

      <HomeFeaturesLazy
        titleLead={dictionary.home.whyChooseTitleLead}
        titleAccent={dictionary.home.whyChooseTitleAccent}
        compactTitle={locale === "ru"}
        items={[
          {
            title: dictionary.home.features.deliveryTitle,
            description: dictionary.home.features.deliveryDescription,
            imageSrc: staticAssetUrl("/assets/home/feature-delivery.webp"),
            tone: "red",
          },
          {
            title: dictionary.home.features.qualityTitle,
            description: dictionary.home.features.qualityDescription,
            imageSrc: staticAssetUrl("/assets/home/feature-fresh.webp"),
            tone: "white",
          },
          {
            title: dictionary.home.features.paymentTitle,
            description: dictionary.home.features.paymentDescription,
            imageSrc: staticAssetUrl("/assets/home/feature-payment.webp"),
            tone: "cream",
          },
          {
            title: dictionary.home.features.shippingTitle,
            description: dictionary.home.features.shippingDescription,
            imageSrc: staticAssetUrl("/assets/home/feature-shipping.webp"),
            tone: "yellow",
          },
        ]}
      />
    </div>
  );
}
