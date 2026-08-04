/**
 * Resolves a storefront static path under `public/` to an R2 CDN URL when
 * `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is set; otherwise returns the local path.
 */
export function staticAssetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    return normalized;
  }
  return `${base}${normalized}`;
}
