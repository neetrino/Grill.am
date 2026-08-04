"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { NavCategoriesDropdown } from "@/components/layout/NavCategoriesDropdown";
import {
  isStorefrontNavActive,
  type StorefrontNavItem,
} from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { Locale } from "@/lib/i18n/config";

type PrimaryNavLinksProps = {
  locale: Locale;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
  allCategoriesLabel: string;
  onHomeActiveClick: () => void;
};

function PrimaryNavLinksInner({
  locale,
  navItems,
  categories,
  allCategoriesLabel,
  onHomeActiveClick,
  categorySlug,
}: PrimaryNavLinksProps & { categorySlug: string | null }) {
  const pathname = usePathname();
  const productsPath = `/${locale}/products`;
  const isOnProducts =
    pathname === productsPath || pathname.startsWith(`${productsPath}/`);
  const isOnProductsList = pathname === productsPath;

  return (
    <>
      {navItems.map((item) => {
        if (item.kind === "categories") {
          return (
            <NavCategoriesDropdown
              key={item.id}
              locale={locale}
              label={item.label}
              categories={categories}
              allLabel={allCategoriesLabel}
              activeCategorySlug={categorySlug}
              isOnProductsList={isOnProductsList}
              isMenuActive={isOnProducts}
            />
          );
        }

        const active = isStorefrontNavActive(pathname, item, locale, {
          categorySlug,
        });

        return (
          <AppLink
            key={item.id}
            href={item.href}
            prefetchPolicy="intent"
            aria-current={active ? "page" : undefined}
            className={`rounded-[10px] px-4 py-2 text-base font-semibold whitespace-nowrap transition ${
              active
                ? "text-brand-red"
                : "text-[#101010] hover:text-brand-red"
            }`}
            onClick={(event) => {
              if (!active) {
                return;
              }
              event.preventDefault();
              if (item.id === "home") {
                onHomeActiveClick();
                return;
              }
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            }}
          >
            {item.label}
          </AppLink>
        );
      })}
    </>
  );
}

function PrimaryNavLinksWithSearchParams(props: PrimaryNavLinksProps) {
  const searchParams = useSearchParams();
  return (
    <PrimaryNavLinksInner
      {...props}
      categorySlug={searchParams.get("category")}
    />
  );
}

/** Desktop primary nav; Suspense isolates useSearchParams from sticky chrome. */
export function PrimaryNavLinks(props: PrimaryNavLinksProps) {
  return (
    <Suspense
      fallback={
        <PrimaryNavLinksInner {...props} categorySlug={null} />
      }
    >
      <PrimaryNavLinksWithSearchParams {...props} />
    </Suspense>
  );
}
