"use client";

import { Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import type { TranslationsJson } from "@/db/schema";
import {
  ADMIN_FIELD,
  ADMIN_FORM_STACK,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import {
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import type { ModifierCatalogItem } from "@/features/products/domain/modifier-catalog";
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from "@/features/products/application/list-admin-products";
import {
  createProductFromDrawerAction,
  updateProductFromDrawerAction,
} from "@/features/products/application/upsert-product";
import type { ProductCustomization } from "@/features/products/domain/customization";
import {
  normalizeProductSlug,
  resolveSharedProductSlug,
} from "@/features/products/domain/product-slug";
import { ProductDrawerCategories } from "@/features/products/ui/ProductDrawerCategories";
import { ProductDrawerCustomization } from "@/features/products/ui/ProductDrawerCustomization";
import {
  ProductDrawerImages,
  type ProductDraftImage,
} from "@/features/products/ui/ProductDrawerImages";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

type ProductDrawerProduct = Pick<
  AdminProductListItem,
  | "id"
  | "sku"
  | "customization"
  | "priceAmount"
  | "compareAtAmount"
  | "stockOnHand"
  | "status"
  | "categoryIds"
  | "images"
  | "translations"
>;

type LocaleDraft = {
  title: string;
  description: string;
  shortDescription: string;
  composition: string;
};

const EMPTY_CUSTOMIZATION: ProductCustomization = {
  optionGroups: [],
  addons: [],
  exclusions: [],
};

type ProductDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  product?: ProductDrawerProduct | null;
  categories: AdminCategoryOption[];
  modifierCatalog: ModifierCatalogItem[];
};

function emptyDraft(): LocaleDraft {
  return {
    title: "",
    description: "",
    shortDescription: "",
    composition: "",
  };
}

function draftsFromTranslations(
  translations: TranslationsJson | undefined,
): Record<Locale, LocaleDraft> {
  const next = {
    hy: emptyDraft(),
    en: emptyDraft(),
    ru: emptyDraft(),
  } satisfies Record<Locale, LocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      description: copy.description ?? "",
      shortDescription: copy.shortDescription ?? "",
      composition: copy.composition ?? "",
    };
  }

  return next;
}

function resolveInitialLocale(
  pageLocale: string,
  translations: TranslationsJson | undefined,
): Locale {
  if (isLocale(pageLocale) && translations?.[pageLocale]?.title?.trim()) {
    return pageLocale;
  }
  const withTitle = locales.find((loc) =>
    Boolean(translations?.[loc]?.title?.trim()),
  );
  if (withTitle) {
    return withTitle;
  }
  return isLocale(pageLocale) ? pageLocale : "hy";
}

function buildLocaleCopies(
  drafts: Record<Locale, LocaleDraft>,
): Partial<
  Record<
    Locale,
    {
      title: string;
      description?: string;
      shortDescription?: string;
      composition?: string;
    }
  >
> {
  const next: ReturnType<typeof buildLocaleCopies> = {};
  for (const loc of locales) {
    const draft = drafts[loc];
    const title = draft.title.trim();
    if (!title) continue;
    next[loc] = {
      title,
      description: draft.description.trim() || undefined,
      shortDescription: draft.shortDescription.trim() || undefined,
      composition: draft.composition.trim() || undefined,
    };
  }
  return next;
}

function filledLocalesFromDrafts(
  drafts: Record<Locale, LocaleDraft>,
): Set<Locale> {
  const filled = new Set<Locale>();
  for (const loc of locales) {
    if (drafts[loc].title.trim()) {
      filled.add(loc);
    }
  }
  return filled;
}

type DrawerDraftSnapshot = {
  sessionKey: string;
  drafts: Record<Locale, LocaleDraft>;
  slug: string;
  slugTouched: boolean;
  activeLocale: Locale;
  priceAmount: string;
  compareAtAmount: string;
  sku: string;
  stockOnHand: string;
  categoryIds: string[];
  customization: ProductCustomization;
};

const DRAWER_SNAPSHOT_KEY = "grill:admin-product-drawer-draft";
const PRODUCT_DRAWER_FORM_ID = "product-drawer-form";

function readDrawerSnapshot(sessionKey: string): DrawerDraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAWER_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DrawerDraftSnapshot;
    if (parsed.sessionKey !== sessionKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDrawerSnapshot(snapshot: DrawerDraftSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAWER_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearDrawerSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAWER_SNAPSHOT_KEY);
  } catch {
    // Ignore.
  }
}

function imagesFromProduct(
  product: ProductDrawerProduct | null,
): ProductDraftImage[] {
  if (!product) return [];
  return product.images.map((image) => ({
    key: image.id,
    previewUrl: image.url,
    isPrimary: image.isPrimary,
    existingId: image.id,
  }));
}

export function ProductDrawer({
  locale,
  open,
  onClose,
  product = null,
  categories: initialCategories,
  modifierCatalog,
}: ProductDrawerProps) {
  const router = useRouter();
  const dictionary = useAdminDictionary();
  const isEdit = product != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() =>
    resolveInitialLocale(locale, product?.translations),
  );
  const [drafts, setDrafts] = useState<Record<Locale, LocaleDraft>>(() =>
    draftsFromTranslations(product?.translations),
  );
  const [slug, setSlug] = useState(() =>
    resolveSharedProductSlug(product?.translations),
  );
  const [slugTouched, setSlugTouched] = useState(() =>
    Boolean(resolveSharedProductSlug(product?.translations)),
  );
  const [customization, setCustomization] =
    useState<ProductCustomization>(EMPTY_CUSTOMIZATION);
  const [images, setImages] = useState<ProductDraftImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [categories, setCategories] =
    useState<AdminCategoryOption[]>(initialCategories);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [priceAmount, setPriceAmount] = useState("");
  const [compareAtAmount, setCompareAtAmount] = useState("");
  const [sku, setSku] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  /** Prevents prop churn (e.g. categories refresh) from wiping in-progress locale drafts. */
  const [editorSessionKey, setEditorSessionKey] = useState<string | null>(
    null,
  );
  // Tracks the open/product/categories/locale combo last synced into state.
  const [synced, setSynced] = useState({
    open,
    product,
    initialCategories,
    locale,
  });

  // Reset (on close) or seed (on open / product / categories / locale
  // change) local form state during render instead of a synchronous
  // setState inside an effect.
  if (
    open !== synced.open ||
    product !== synced.product ||
    initialCategories !== synced.initialCategories ||
    locale !== synced.locale
  ) {
    setSynced({ open, product, initialCategories, locale });

    if (!open) {
      setEditorSessionKey(null);
      clearDrawerSnapshot();
      setActiveLocale(resolveInitialLocale(locale, undefined));
      setDrafts(draftsFromTranslations(undefined));
      setSlug("");
      setSlugTouched(false);
      setCustomization(EMPTY_CUSTOMIZATION);
      setImages((current) => {
        for (const image of current) {
          if (image.file) URL.revokeObjectURL(image.previewUrl);
        }
        return [];
      });
      setRemovedImageIds([]);
      setCategories(initialCategories);
      setCategoryIds([]);
      setPriceAmount("");
      setCompareAtAmount("");
      setSku("");
      setStockOnHand("");
      setError(null);
    } else {
      setCategories(initialCategories);

      const sessionKey = product?.id ?? "__new__";
      if (editorSessionKey !== sessionKey) {
        setEditorSessionKey(sessionKey);

        const snapshot = readDrawerSnapshot(sessionKey);
        if (snapshot) {
          setActiveLocale(snapshot.activeLocale);
          setDrafts(snapshot.drafts);
          setSlug(snapshot.slug);
          setSlugTouched(snapshot.slugTouched);
          setCustomization(snapshot.customization);
          setCategoryIds(snapshot.categoryIds);
          setPriceAmount(snapshot.priceAmount);
          setCompareAtAmount(snapshot.compareAtAmount);
          setSku(snapshot.sku);
          setStockOnHand(snapshot.stockOnHand);
          if (product) {
            setImages(imagesFromProduct(product));
            setRemovedImageIds([]);
          }
          setError(null);
        } else {
          setActiveLocale(resolveInitialLocale(locale, product?.translations));
          setDrafts(draftsFromTranslations(product?.translations));
          const sharedSlug = resolveSharedProductSlug(product?.translations);
          setSlug(sharedSlug);
          setSlugTouched(Boolean(sharedSlug));
          if (product) {
            setCustomization(product.customization ?? EMPTY_CUSTOMIZATION);
            setImages(imagesFromProduct(product));
            setRemovedImageIds([]);
            setCategoryIds(product.categoryIds);
            setPriceAmount(String(product.priceAmount));
            setCompareAtAmount(
              product.compareAtAmount != null
                ? String(product.compareAtAmount)
                : "",
            );
            setSku(product.sku);
            setStockOnHand(String(product.stockOnHand));
            setError(null);
          } else {
            setCustomization(EMPTY_CUSTOMIZATION);
            setImages([]);
            setRemovedImageIds([]);
            setCategoryIds([]);
            setPriceAmount("");
            setCompareAtAmount("");
            setSku("");
            setStockOnHand("");
            setError(null);
          }
        }
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    writeDrawerSnapshot({
      sessionKey: product?.id ?? "__new__",
      drafts,
      slug,
      slugTouched,
      activeLocale,
      priceAmount,
      compareAtAmount,
      sku,
      stockOnHand,
      categoryIds,
      customization,
    });
  }, [
    open,
    product?.id,
    drafts,
    slug,
    slugTouched,
    activeLocale,
    priceAmount,
    compareAtAmount,
    sku,
    stockOnHand,
    categoryIds,
    customization,
  ]);

  function handleImagesChange(next: ProductDraftImage[]): void {
    const nextKeys = new Set(next.map((image) => image.key));
    const removedExisting = images
      .filter(
        (image) =>
          image.existingId &&
          !nextKeys.has(image.key) &&
          !removedImageIds.includes(image.existingId),
      )
      .map((image) => image.existingId as string);
    if (removedExisting.length > 0) {
      setRemovedImageIds((prev) => [...prev, ...removedExisting]);
    }
    setImages(next);
  }

  function updateDraft(
    localeForDraft: Locale,
    patch: Partial<LocaleDraft>,
  ): void {
    setDrafts((current) => ({
      ...current,
      [localeForDraft]: { ...current[localeForDraft], ...patch },
    }));
    if (patch.title != null && !slugTouched) {
      setSlug(normalizeProductSlug(patch.title));
    }
  }

  const draft = drafts[activeLocale];
  const form = dictionary.products.form;
  const drawerTitle = isEdit
    ? dictionary.products.editProduct
    : dictionary.products.addProduct;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={drawerTitle}
      closeLabel={dictionary.common.close}
      desktopWidthPercent={48}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={PRODUCT_DRAWER_FORM_ID}
            disabled={isPending}
            className="gap-2"
          >
            {!isEdit && !isPending ? (
              <Plus className="h-4 w-4" aria-hidden />
            ) : null}
            {isPending
              ? isEdit
                ? dictionary.common.saving
                : dictionary.common.creating
              : isEdit
                ? dictionary.common.save
                : dictionary.common.create}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {dictionary.common.cancel}
          </button>
        </div>
      }
    >
      <form
        id={PRODUCT_DRAWER_FORM_ID}
        className={ADMIN_FORM_STACK}
        onSubmit={(event) => {
            event.preventDefault();
            const localeCopies = buildLocaleCopies(drafts);
            if (Object.keys(localeCopies).length === 0) {
              setError(dictionary.products.errors.titleRequired);
              return;
            }
            const newImages = images.filter((image) => image.file);
            const primaryImage = images.find((image) => image.isPrimary);
            const primaryNewIndex = primaryImage?.file
              ? newImages.findIndex((image) => image.key === primaryImage.key)
              : null;
            const nextSlug = normalizeProductSlug(slug);
            if (!nextSlug) {
              setError(dictionary.products.errors.slugRequired);
              return;
            }

            const payload = {
              editingLocale: activeLocale,
              sku: sku.trim(),
              slug: nextSlug,
              localeCopies,
              customization,
              priceAmount: Number(priceAmount),
              compareAtAmount: compareAtAmount.trim()
                ? Number(compareAtAmount)
                : null,
              stockOnHand: Number(stockOnHand),
              categoryIds,
              status: (product?.status === "ACTIVE" ||
              product?.status === "ARCHIVED"
                ? product.status
                : "DRAFT") as "DRAFT" | "ACTIVE" | "ARCHIVED",
              primaryExistingId: primaryImage?.existingId ?? null,
              primaryNewIndex:
                primaryNewIndex != null && primaryNewIndex >= 0
                  ? primaryNewIndex
                  : null,
              removeImageIds: removedImageIds,
            };

            const formData = new FormData();
            formData.set("data", JSON.stringify(payload));
            for (const image of newImages) {
              if (image.file) formData.append("images", image.file);
            }

            startTransition(async () => {
              setError(null);
              const result =
                isEdit && product
                  ? await updateProductFromDrawerAction(
                      locale,
                      product.id,
                      formData,
                    )
                  : await createProductFromDrawerAction(locale, formData);

              if (!result.ok) {
                const productErrors = dictionary.products.errors;
                if (result.error.code === "SKU_EXISTS") {
                  setError(productErrors.skuExists);
                  return;
                }
                if (result.error.code === "SLUG_EXISTS") {
                  setError(productErrors.slugExists);
                  return;
                }
                setError(result.error.message);
                return;
              }

              clearDrawerSnapshot();
              onClose();
              router.refresh();
            });
        }}
      >
        <AdminLocaleTabs
              activeLocale={activeLocale}
              onChange={setActiveLocale}
              disabled={isPending}
              filledLocales={filledLocalesFromDrafts(drafts)}
            />

            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>
                {form.title} <span className="text-red-600">*</span>
              </span>
              <input
                value={draft.title}
                onChange={(event) =>
                  updateDraft(activeLocale, { title: event.target.value })
                }
                placeholder={form.titlePlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>
                {form.slug} <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder={form.slugPlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
              <span className="mt-1 block text-xs text-gray-500">
                {form.slugHint}
              </span>
            </label>

            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{form.shortDescription}</span>
              <textarea
                value={draft.shortDescription}
                onChange={(event) =>
                  updateDraft(activeLocale, {
                    shortDescription: event.target.value,
                  })
                }
                placeholder={form.shortDescriptionPlaceholder}
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
            </label>

            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{form.description}</span>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  updateDraft(activeLocale, {
                    description: event.target.value,
                  })
                }
                placeholder={form.descriptionPlaceholder}
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
            </label>

            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{form.composition}</span>
              <textarea
                value={draft.composition}
                onChange={(event) =>
                  updateDraft(activeLocale, {
                    composition: event.target.value,
                  })
                }
                placeholder={form.compositionPlaceholder}
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
            </label>

            <ProductDrawerCustomization
              value={customization}
              catalog={modifierCatalog}
              onChange={setCustomization}
              disabled={isPending}
            />

            <ProductDrawerImages
              images={images}
              disabled={isPending}
              onChange={handleImagesChange}
            />

            <ProductDrawerCategories
              locale={locale}
              categories={categories}
              selectedIds={categoryIds}
              disabled={isPending}
              onCategoriesChange={setCategories}
              onSelectedChange={setCategoryIds}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={ADMIN_FIELD}>
                <span className={ADMIN_LABEL}>
                  {form.price} <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  min={0}
                  type="number"
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  placeholder={form.pricePlaceholder}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label className={ADMIN_FIELD}>
                <span className={ADMIN_LABEL}>{form.compareAtPrice}</span>
                <input
                  min={0}
                  type="number"
                  value={compareAtAmount}
                  onChange={(event) => setCompareAtAmount(event.target.value)}
                  placeholder={form.compareAtPlaceholder}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={ADMIN_FIELD}>
                <span className={ADMIN_LABEL}>
                  {form.sku} <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder={form.skuPlaceholder}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label className={ADMIN_FIELD}>
                <span className={ADMIN_LABEL}>
                  {form.quantity} <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  min={0}
                  type="number"
                  value={stockOnHand}
                  onChange={(event) => setStockOnHand(event.target.value)}
                  placeholder={form.stockPlaceholder}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </SideSheet>
  );
}
