import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { CatalogCartSidebar } from "@/features/cart/ui/CatalogCartSidebar";
import { getCartItemCount } from "@/features/cart/cart";
import { listCatalogProducts } from "@/features/products/application/list-catalog-products";
import {
  catalogHref,
  parseCatalogSearchParams,
} from "@/features/products/schemas/catalog-list";
import { CatalogActiveChips } from "@/features/products/ui/CatalogActiveChips";
import { CatalogBreadcrumbs } from "@/features/products/ui/CatalogBreadcrumbs";
import { CatalogFilters } from "@/features/products/ui/CatalogFilters";
import { CatalogListingView } from "@/features/products/ui/CatalogListingView";
import { MobileCatalogFiltersToggle } from "@/features/products/ui/MobileCatalogFiltersToggle";
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

  const [currency, user, cartItemCount] = await Promise.all([
    getSelectedCurrency(),
    getCurrentUser(),
    getCartItemCount(),
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

  const selectedCategory =
    filters.category.length > 0
      ? catalog.categories.find((category) =>
          filters.category.includes(category.slug),
        )
      : null;

  const filterLabels = {
    categories: catalogCopy.categories,
    allCategories: catalogCopy.allCategories,
    price: catalogCopy.price,
    minPrice: catalogCopy.minPrice,
    maxPrice: catalogCopy.maxPrice,
  };

  return (
    <section className="storefront-bleed -mt-10 mb-[-2.5rem]">
      <div className="grid min-h-[calc(100dvh-12rem)] lg:grid-cols-[256px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)_288px]">
        <div className="hidden lg:block">
          <div className="sticky top-[var(--storefront-header-offset)] z-10 h-[calc(100dvh-var(--storefront-header-offset))] self-start">
            <CatalogFilters
              locale={rawLocale}
              filters={filters}
              categories={catalog.categories}
              totalProductCount={catalog.allProductCount}
              priceBounds={catalog.priceBoundsDisplay}
              currencySymbol={currencySymbols[currency]}
              labels={filterLabels}
              variant="sidebar"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-[#f2f0f0] px-4 pt-3 pb-10 sm:px-6 lg:px-8">
          <MobileCatalogFiltersToggle label={catalogCopy.filters}>
            <CatalogFilters
              locale={rawLocale}
              filters={filters}
              categories={catalog.categories}
              totalProductCount={catalog.allProductCount}
              priceBounds={catalog.priceBoundsDisplay}
              currencySymbol={currencySymbols[currency]}
              labels={filterLabels}
              variant="panel"
            />
          </MobileCatalogFiltersToggle>

          <CatalogBreadcrumbs
            backLabel={catalogCopy.back}
            backHref={`/${rawLocale}`}
            items={[
              {
                label: dictionary.nav.products,
                href: catalogHref(rawLocale, {
                  category: [],
                  sort: filters.sort,
                  page: 1,
                  pageSize: filters.pageSize,
                }),
              },
              ...(selectedCategory
                ? [{ label: selectedCategory.title }]
                : []),
            ]}
          />

          <CatalogListingView
            locale={rawLocale}
            filters={filters}
            sortLabels={{
              popular: catalogCopy.sortPopular,
              newest: catalogCopy.sortNewest,
              onSale: catalogCopy.sortOnSale,
            }}
            viewLabels={{
              group: catalogCopy.viewModeLabel,
              three: catalogCopy.viewThreeColumns,
              four: catalogCopy.viewFourColumns,
            }}
            chips={
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
                  onSaleChip: catalogCopy.onSaleChip,
                  removeFilter: catalogCopy.removeFilter,
                }}
              />
            }
            empty={
              priced.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-[#e5e7eb] px-6 py-16 text-center">
                  <p className="text-base font-medium text-[#101828]">
                    {catalogCopy.emptyTitle}
                  </p>
                  <p className="mt-2 text-sm text-[#4a5565]">
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
                    className="mt-6 inline-flex rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
                  >
                    {catalogCopy.clearFilters}
                  </AppLink>
                </div>
              ) : null
            }
          >
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
                appearIndex={index}
                locale={rawLocale}
                productId={product.id}
                inWishlist={wishlistIds.has(product.id)}
                isSignedIn={Boolean(user)}
                wishlistLabel={dictionary.nav.wishlist}
                addToCartLabel={dictionary.product.addToCart}
                requiresConfiguration={product.requiresConfiguration}
              />
            ))}
          </CatalogListingView>

          {totalPages > 1 ? (
            <nav
              aria-label={catalogCopy.paginationLabel}
              className="mt-8 flex items-center justify-center gap-4"
            >
              {filters.page > 1 ? (
                <AppLink
                  href={catalogHref(rawLocale, filters, {
                    page: filters.page - 1,
                  })}
                  prefetchPolicy="intent"
                  className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  {catalogCopy.previousPage}
                </AppLink>
              ) : (
                <span className="rounded-full border border-transparent px-4 py-2 text-sm text-[#d1d5db]">
                  {catalogCopy.previousPage}
                </span>
              )}
              <span className="text-sm text-[#4a5565]">
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
                  className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  {catalogCopy.nextPage}
                </AppLink>
              ) : (
                <span className="rounded-full border border-transparent px-4 py-2 text-sm text-[#d1d5db]">
                  {catalogCopy.nextPage}
                </span>
              )}
            </nav>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-[var(--storefront-header-offset)] z-10 h-[calc(100dvh-var(--storefront-header-offset))] self-start">
            <CatalogCartSidebar
              locale={rawLocale}
              currency={currency}
              labels={dictionary.cartDrawer}
              initialItemCount={cartItemCount}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
