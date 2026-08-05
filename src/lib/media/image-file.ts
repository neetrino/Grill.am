const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MEDIA_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function extensionForImageMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

/** True when the MIME type is allowed for product/category media. */
export function isAllowedImageMime(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType);
}

/** Validates MIME and byte size for image buffers (CLI / remote downloads). */
export function validateImageBytes(
  mimeType: string,
  byteSize: number,
  maxBytes = MEDIA_IMAGE_MAX_BYTES,
): string | null {
  if (!ALLOWED_MIME.has(mimeType)) {
    return "Only JPEG, PNG, WebP, or GIF images are allowed.";
  }
  if (byteSize > maxBytes) {
    return `Image must be ${Math.floor(maxBytes / (1024 * 1024))}MB or smaller.`;
  }
  if (byteSize <= 0) {
    return "Image is empty.";
  }
  return null;
}

/** Validates MIME and size for admin image uploads. */
export function validateImageFile(
  file: File,
  maxBytes = MEDIA_IMAGE_MAX_BYTES,
): string | null {
  return validateImageBytes(file.type, file.size, maxBytes);
}
