import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/features/products/ui/ProductCard";
import { listWishlistProducts } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type WishlistPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const title = (
    <h1 className="text-[26px] leading-tight font-black text-brand-red uppercase sm:text-[30px] sm:leading-[1.2]">
      {dictionary.wishlist.titleLead}{" "}
      <span className="text-[#171717]">{dictionary.wishlist.titleAccent}</span>
    </h1>
  );

  const [user, currency, products] = await Promise.all([
    getCurrentUser(),
    getSelectedCurrency(),
    listWishlistProducts(rawLocale),
  ]);

  if (!user) {
    return (
      <section className="storefront-bleed -mt-10 mb-[-2.5rem] bg-[#f2f0f0] px-4 py-10 pb-24 sm:px-6 md:pb-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          {title}
          <p className="text-gray-600">
            <Link
              href={`/${rawLocale}/login?next=${encodeURIComponent(`/${rawLocale}/wishlist`)}`}
              className="font-medium text-gray-900 underline underline-offset-2"
            >
              {dictionary.header.login}
            </Link>{" "}
            — {dictionary.wishlist.signInPrompt}
          </p>
        </div>
      </section>
    );
  }

  const formatPrice = await createDisplayPriceFormatter(rawLocale, currency);
  const priced = products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      product,
      priceFormatted: price.formatted,
      compareAtFormatted: compareAt?.formatted ?? null,
    };
  });

  return (
    <section className="storefront-bleed -mt-10 mb-[-2.5rem] bg-[#f2f0f0] px-4 py-10 pb-24 sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {title}

        {priced.length === 0 ? (
          <p className="text-gray-600">{dictionary.wishlist.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {priced.map(
              ({ product, priceFormatted, compareAtFormatted }, index) => (
                <ProductCard
                  key={product.id}
                  href={`/${rawLocale}/products/${product.translation.slug}`}
                  title={product.translation.title}
                  priceFormatted={priceFormatted}
                  compareAtFormatted={compareAtFormatted}
                  discountPercent={product.discountPercent}
                  imageUrl={product.imageUrl}
                  inStock={product.stockOnHand > 0}
                  priority={index < 4}
                  appearIndex={index}
                  locale={rawLocale}
                  productId={product.id}
                  inWishlist
                  isSignedIn
                  wishlistLabel={dictionary.nav.wishlist}
                  addToCartLabel={dictionary.product.addToCart}
                  requiresConfiguration={product.requiresConfiguration}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
