/** Shared Next.js cache tags for public storefront read models. */
export const CACHE_TAGS = {
  products: "products",
  /** All PDP caches — invalidate on price-wide changes (promotions, categories). */
  productDetail: "product-detail",
  product: (id: string) => `product:${id}`,
  productSlug: (locale: string, slug: string) =>
    `product-slug:${locale}:${slug}`,
  productReviews: (id: string) => `product-reviews:${id}`,
  hero: "hero",
  popups: "popups",
  stores: "stores",
  blog: "blog",
  blogPost: (id: string) => `blog:${id}`,
  blogPostSlug: (locale: string, slug: string) =>
    `blog-slug:${locale}:${slug}`,
  careers: "careers",
  jobPosting: (id: string) => `job:${id}`,
  jobPostingSlug: (locale: string, slug: string) =>
    `job-slug:${locale}:${slug}`,
  settings: "settings",
} as const;

/**
 * Time-based window for listing/home/content `unstable_cache` (seconds).
 * PDP HTML uses the literal `revalidate = false` — Next cannot statically
 * analyze an imported constant on the route module.
 */
export const PUBLIC_CACHE_REVALIDATE_SECONDS = 15 * 60;

/** Tag-only lifetime — no timer, no periodic Data Cache writes. */
export const ON_DEMAND_CACHE_REVALIDATE = false;
