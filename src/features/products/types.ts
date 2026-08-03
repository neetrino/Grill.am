import type { ProductCustomization } from "@/features/products/domain/customization";

type LocaleTranslation = {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  composition?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type CatalogProduct = {
  id: string;
  sku: string;
  /** Catalog list price before automatic discount. */
  listPriceAmount: number;
  /** Customer-facing unit price after automatic discount. */
  priceAmount: number;
  compareAtAmount: number | null;
  discountPercent: number | null;
  stockOnHand: number;
  translation: LocaleTranslation;
  imageUrl: string | null;
  /** Primary (or first) category title for catalog cards. */
  categoryTitle: string | null;
};

export type ProductGalleryImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type ProductCategoryRef = {
  id: string;
  title: string;
  slug: string;
};

export type ProductDetail = CatalogProduct & {
  images: ProductGalleryImage[];
  categories: ProductCategoryRef[];
  /** Raw customization catalog from the product row (null when unset). */
  customization: ProductCustomization | null;
  isFeatured: boolean;
};
