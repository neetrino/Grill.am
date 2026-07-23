import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { listCatalogProducts } from "@/features/products/application/list-catalog-products";
import {
  catalogHref,
  parseCatalogSearchParams,
} from "@/features/products/schemas/catalog-list";
import { CatalogActiveChips } from "@/features/products/ui/CatalogActiveChips";
import { CatalogFilters } from "@/features/products/ui/CatalogFilters";
import { CatalogSortBar } from "@/features/products/ui/CatalogSortBar";
import { ProductCard } from "@/features/products/ui/ProductCard";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getCheckoutRateSnapshot } from "@/lib/fx/service";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { currencySymbols } from "@/lib/money/currency";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale: rawLocale } = await params;
  const rawSearch = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  let filters = parseCatalogSearchParams(rawSearch);
  const dictionary = getDictionary(rawLocale);
  const catalogCopy = dictionary.catalog;

  const [currency, user] = await Promise.all([
    getSelectedCurrency(),
    getCurrentUser(),
  ]);
  const rateQuote = await getCheckoutRateSnapshot(currency);

  let catalog = await listCatalogProducts(
    rawLocale,
    filters,
    currency,
    rateQuote.rate,
  );

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  if (filters.page > totalPages) {
    filters = { ...filters, page: totalPages };
    catalog = await listCatalogProducts(
      rawLocale,
      filters,
      currency,
      rateQuote.rate,
    );
  }

  const { products } = catalog;
  const [wishlistIds, formatPrice] = await Promise.all([
    getWishlistProductIds(products.map((product) => product.id)),
    createDisplayPriceFormatter(rawLocale, currency),
  ]);

  const priced = products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      product,
      price,
      compareAtFormatted: compareAt?.formatted ?? null,
    };
  });

  const filterLabels = {
    filters: catalogCopy.filters,
    search: catalogCopy.search,
    searchPlaceholder: catalogCopy.searchPlaceholder,
    price: catalogCopy.price,
    minPrice: catalogCopy.minPrice,
    maxPrice: catalogCopy.maxPrice,
    categories: catalogCopy.categories,
    inStockOnly: catalogCopy.inStockOnly,
    clearFilters: catalogCopy.clearFilters,
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {dictionary.nav.products}
        </h1>
        <p className="text-sm text-gray-600">{catalogCopy.subtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <details className="rounded-xl border border-gray-200 bg-white p-4 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
              {catalogCopy.filters}
            </summary>
            <div className="mt-4">
              <CatalogFilters
                locale={rawLocale}
                filters={filters}
                categories={catalog.categories}
                priceBounds={catalog.priceBoundsDisplay}
                currencySymbol={currencySymbols[currency]}
                labels={filterLabels}
              />
            </div>
          </details>
          <div className="hidden lg:block">
            <CatalogFilters
              locale={rawLocale}
              filters={filters}
              categories={catalog.categories}
              priceBounds={catalog.priceBoundsDisplay}
              currencySymbol={currencySymbols[currency]}
              labels={filterLabels}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <CatalogSortBar
            locale={rawLocale}
            filters={filters}
            total={catalog.total}
            labels={{
              sortLabel: catalogCopy.sortLabel,
              newest: catalogCopy.sortNewest,
              priceAsc: catalogCopy.sortPriceAsc,
              priceDesc: catalogCopy.sortPriceDesc,
              popular: catalogCopy.sortPopular,
              resultsCount: catalogCopy.resultsCount,
            }}
          />

          <CatalogActiveChips
            locale={rawLocale}
            filters={filters}
            categories={catalog.categories}
            currencyCode={currency}
            labels={{
              searchChip: catalogCopy.searchChip,
              minPriceChip: catalogCopy.minPriceChip,
              maxPriceChip: catalogCopy.maxPriceChip,
              inStockChip: catalogCopy.inStockChip,
              removeFilter: catalogCopy.removeFilter,
            }}
          />

          {priced.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
              <p className="text-base font-medium text-gray-900">
                {catalogCopy.emptyTitle}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {catalogCopy.emptyDescription}
              </p>
              <AppLink
                href={catalogHref(rawLocale, {
                  category: [],
                  sort: "newest",
                  page: 1,
                  pageSize: filters.pageSize,
                })}
                prefetchPolicy="intent"
                className="mt-6 inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {catalogCopy.clearFilters}
              </AppLink>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {priced.map(({ product, price, compareAtFormatted }, index) => (
                <ProductCard
                  key={product.id}
                  href={`/${rawLocale}/products/${product.translation.slug}`}
                  title={product.translation.title}
                  categoryTitle={product.categoryTitle}
                  priceFormatted={price.formatted}
                  compareAtFormatted={compareAtFormatted}
                  discountPercent={product.discountPercent}
                  imageUrl={product.imageUrl}
                  inStock={product.stockOnHand > 0}
                  priority={index < 4}
                  locale={rawLocale}
                  productId={product.id}
                  inWishlist={wishlistIds.has(product.id)}
                  isSignedIn={Boolean(user)}
                  wishlistLabel={dictionary.nav.wishlist}
                  addToCartLabel={dictionary.product.addToCart}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav
              aria-label={catalogCopy.paginationLabel}
              className="flex items-center justify-center gap-4"
            >
              {filters.page > 1 ? (
                <AppLink
                  href={catalogHref(rawLocale, filters, {
                    page: filters.page - 1,
                  })}
                  prefetchPolicy="intent"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {catalogCopy.previousPage}
                </AppLink>
              ) : (
                <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-gray-300">
                  {catalogCopy.previousPage}
                </span>
              )}
              <span className="text-sm text-gray-600">
                {catalogCopy.pageStatus
                  .replace("{page}", String(filters.page))
                  .replace("{total}", String(totalPages))}
              </span>
              {filters.page < totalPages ? (
                <AppLink
                  href={catalogHref(rawLocale, filters, {
                    page: filters.page + 1,
                  })}
                  prefetchPolicy="intent"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {catalogCopy.nextPage}
                </AppLink>
              ) : (
                <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-gray-300">
                  {catalogCopy.nextPage}
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
