/**
 * Next.js Image Optimization allowlists.
 * Narrower than the framework defaults so Vercel does not emit unused
 * 2K/4K/AVIF/quality variants for every product photo.
 */
export const IMAGE_OPTIMIZATION_FORMATS = ["image/webp"] as const;

/** Viewport widths we actually serve (cards → 1440 hero / 100vw covers). */
export const IMAGE_DEVICE_SIZES = [640, 750, 1080, 1200, 1920] as const;

/** Icon / thumbnail widths used in header, cart, and gallery thumbs. */
export const IMAGE_INLINE_SIZES = [48, 64, 96, 128, 256] as const;

/** Single quality — extra `q=` values each create a billed transform. */
export const IMAGE_QUALITY = 75;

/** Versioned R2 keys; 30 days avoids repeat transforms of the same byte. */
export const IMAGE_MINIMUM_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
