import { AppLink } from "@/components/ui/AppLink";
import type { CatalogFilterCategory } from "@/features/products/application/list-catalog-products";
import {
  catalogHref,
  type CatalogFilter,
} from "@/features/products/schemas/catalog-list";
import {
  CatalogAllCategoriesIcon,
  resolveCatalogCategoryIcon,
} from "@/features/products/ui/catalog-category-icon";

type MobileCatalogCategoryChipsProps = {
  locale: string;
  filters: CatalogFilter;
  categories: CatalogFilterCategory[];
  allCategoriesLabel: string;
  categoriesLabel: string;
};

const CHIP_BASE =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold tracking-wide transition";
/** Selected chip — outlined white (Bolory look). */
const CHIP_SELECTED =
  "border-brand-red bg-white text-[#0a0a0a] hover:bg-[#fff4ee]";
/** Unselected chips — filled red with white text. */
const CHIP_IDLE =
  "border-brand-red bg-brand-red text-white hover:bg-brand-red-hot";

/**
 * Mobile catalog category filters — horizontal scrollable pills with icons.
 * Selected chip matches Bolory (white outline); the rest stay red.
 */
export function MobileCatalogCategoryChips({
  locale,
  filters,
  categories,
  allCategoriesLabel,
  categoriesLabel,
}: MobileCatalogCategoryChipsProps) {
  const selectedSlug = filters.category[0] ?? null;

  return (
    <nav
      aria-label={categoriesLabel}
      className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto overscroll-x-contain px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-2.5 pb-0.5">
        <li>
          <AppLink
            href={catalogHref(locale, filters, { category: [], page: 1 })}
            prefetchPolicy="intent"
            className={`${CHIP_BASE} ${
              selectedSlug == null ? CHIP_SELECTED : CHIP_IDLE
            }`}
            aria-current={selectedSlug == null ? "page" : undefined}
          >
            <CatalogAllCategoriesIcon
              className="size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="whitespace-nowrap uppercase">
              {allCategoriesLabel}
            </span>
          </AppLink>
        </li>
        {categories.map((category, index) => {
          const active = selectedSlug === category.slug;
          const Icon = resolveCatalogCategoryIcon(
            category.slug,
            category.title,
            index,
          );

          return (
            <li key={category.id}>
              <AppLink
                href={catalogHref(locale, filters, {
                  category: [category.slug],
                  page: 1,
                })}
                prefetchPolicy="intent"
                className={`${CHIP_BASE} ${
                  active ? CHIP_SELECTED : CHIP_IDLE
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="whitespace-nowrap uppercase">
                  {category.title}
                </span>
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
