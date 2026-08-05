/**
 * Portal target for storefront overlays. Panels position themselves in
 * viewport coordinates, so they mount at the document root.
 */
export function getDropdownPortalRoot(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("getDropdownPortalRoot requires a document");
  }
  return document.body;
}
