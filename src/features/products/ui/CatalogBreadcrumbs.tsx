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
  /** PDP uses accent red for the Back control. */
  backTone?: "muted" | "accent";
};

export function CatalogBreadcrumbs({
  backLabel,
  backHref,
  items,
  backTone = "muted",
}: CatalogBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <AppLink
        href={backHref}
        prefetchPolicy="intent"
        className={`inline-flex items-center gap-1.5 font-medium transition ${
          backTone === "accent"
            ? "text-base text-brand-red hover:opacity-80"
            : "text-[#4a5565] hover:text-brand-red"
        }`}
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        {backLabel}
      </AppLink>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <ChevronRight className="size-3.5 text-[#8b8b8b]" aria-hidden />
          {item.href ? (
            <AppLink
              href={item.href}
              prefetchPolicy="intent"
              className="font-medium text-[#8b8b8b] transition hover:text-brand-red"
            >
              {item.label}
            </AppLink>
          ) : (
            <span className="font-semibold text-[#364153]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
