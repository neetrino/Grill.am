/**
 * PDP `generateStaticParams`. Always empty on purpose.
 *
 * Prerendering every SKU × locale at build wrote an ISR entry on each
 * production deploy. Pages stay on-demand ISR: first request writes once,
 * then HIT until admin tag invalidation.
 */
export function listProductStaticParams(): Array<{
  locale: string;
  slug: string;
}> {
  return [];
}
