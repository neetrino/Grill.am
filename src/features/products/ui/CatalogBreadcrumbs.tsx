import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

type CatalogBreadcrumbItem = {
  label: string;
  href?: string;
};

type CatalogBreadcrumbsProps = {
  backLabel: string;
  backHref: string;
  items: CatalogBreadcrumbItem[];
};

export function CatalogBreadcrumbs({
  backLabel,
  backHref,
  items,
}: CatalogBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm"
    >
      <AppLink
        href={backHref}
        prefetchPolicy="intent"
        className="inline-flex items-center gap-1.5 font-medium text-[#4a5565] transition hover:text-brand-red"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        {backLabel}
      </AppLink>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-[#99a1af]" aria-hidden />
          {item.href ? (
            <AppLink
              href={item.href}
              prefetchPolicy="intent"
              className="font-medium text-[#4a5565] transition hover:text-brand-red"
            >
              {item.label}
            </AppLink>
          ) : (
            <span className="font-semibold text-[#101828]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
