import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/features/products/ui/ProductCard";
import { listWishlistProducts } from "@/features/wishlist/queries";
import { WishlistEmptyState } from "@/features/wishlist/ui/WishlistEmptyState";
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

/** Same gray wash + footer bleed as profile / shop catalog. */
const WISHLIST_SHELL_CLASS =
  "storefront-bleed -mt-10 mb-[-2.5rem] bg-[#f2f0f0]";

const WISHLIST_INNER_CLASS =
  "mx-auto flex w-full max-w-7xl flex-col px-4 pt-6 pb-24 sm:px-6 md:py-10 md:pb-10 lg:px-8 lg:pt-7 lg:pb-7";

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
      <section className={WISHLIST_SHELL_CLASS}>
        <div className={`${WISHLIST_INNER_CLASS} gap-4`}>
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
      unitPriceAmount: Number(price.displayAmount),
      compareAtFormatted: compareAt?.formatted ?? null,
    };
  });

  return (
    <section className={WISHLIST_SHELL_CLASS}>
      <div className={`${WISHLIST_INNER_CLASS} gap-8`}>
        {title}

        {priced.length === 0 ? (
          <WishlistEmptyState
            title={dictionary.wishlist.empty}
            hint={dictionary.wishlist.emptyHint}
            catalogLabel={dictionary.wishlist.browseCatalog}
            catalogHref={`/${rawLocale}/products`}
          />
        ) : (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {priced.map(
              (
                { product, priceFormatted, unitPriceAmount, compareAtFormatted },
                index,
              ) => (
                <ProductCard
                  key={product.id}
                  href={`/${rawLocale}/products/${product.translation.slug}`}
                  title={product.translation.title}
                  priceFormatted={priceFormatted}
                  unitPriceAmount={unitPriceAmount}
                  compareAtFormatted={compareAtFormatted}
                  discountPercent={product.discountPercent}
                  imageUrl={product.imageUrl}
                  inStock={product.stockOnHand > 0}
                  priority={index < 4}
                  appearIndex={index}
                  locale={rawLocale}
                  currency={currency}
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
