"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import {
  createCategoryFromDrawerAction,
  updateCategoryFromDrawerAction,
} from "@/features/categories/actions";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";
import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";

type AddCategoryDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  categories: AdminCategoryListItem[];
  category?: AdminCategoryListItem | null;
};

export function AddCategoryDrawer({
  locale,
  open,
  onClose,
  categories,
  category = null,
}: AddCategoryDrawerProps) {
  const router = useRouter();
  const isEdit = category != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setParentId("");
      setStatus("ACTIVE");
      setImageFile(null);
      setImagePreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return null;
      });
      setRemoveExistingImage(false);
      setError(null);
      return;
    }

    if (category) {
      setTitle(category.title);
      setSlug(category.slug);
      setSlugTouched(true);
      setParentId(category.parentId ?? "");
      setStatus(category.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE");
      setImageFile(null);
      setImagePreview(category.imageUrl);
      setRemoveExistingImage(false);
      setError(null);
    } else {
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setParentId("");
      setStatus("ACTIVE");
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      setError(null);
    }
  }, [open, category]);

  if (!open) return null;

  const displaySlug = slugTouched ? slug : slugifyCategoryTitle(title) || "---";
  const parentOptions = categories.filter((item) => item.id !== category?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit Category" : "Add Category"}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Category" : "Add Category"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const nextSlug =
              slugTouched && slug.trim()
                ? slug.trim()
                : slugifyCategoryTitle(title);

            const formData = new FormData();
            formData.set("title", title.trim());
            formData.set("slug", nextSlug);
            formData.set("parentId", parentId);
            formData.set("status", status);
            if (imageFile) {
              formData.set("image", imageFile);
            }
            if (removeExistingImage) {
              formData.set("removeImage", "1");
            }

            startTransition(async () => {
              setError(null);
              const result =
                isEdit && category
                  ? await updateCategoryFromDrawerAction(
                      locale,
                      category.id,
                      formData,
                    )
                  : await createCategoryFromDrawerAction(locale, formData);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <label className="block">
              <span className={ADMIN_LABEL}>
                Category Title <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter category title"
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>Slug</span>
              <input
                value={displaySlug === "---" ? "" : displaySlug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="---"
                className={ADMIN_INPUT}
                disabled={isPending}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Generated automatically from the title and used on /products.
              </span>
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>Parent Category</span>
              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                className={ADMIN_INPUT}
                disabled={isPending}
              >
                <option value="">None (Root Category)</option>
                {parentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "ACTIVE" | "ARCHIVED")
                }
                className={ADMIN_INPUT}
                disabled={isPending}
              >
                <option value="ACTIVE">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <div>
              <span className={ADMIN_LABEL}>Image</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  {imagePreview ? "Change Image" : "+ Upload Image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    setImagePreview((current) => {
                      if (current?.startsWith("blob:")) {
                        URL.revokeObjectURL(current);
                      }
                      return file ? URL.createObjectURL(file) : null;
                    });
                    setImageFile(file);
                    setRemoveExistingImage(false);
                  }}
                />
                {imagePreview ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview((current) => {
                        if (current?.startsWith("blob:")) {
                          URL.revokeObjectURL(current);
                        }
                        return null;
                      });
                      if (isEdit && category?.imageUrl) {
                        setRemoveExistingImage(true);
                      }
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-red-600"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="mt-3 h-28 w-28 rounded-xl border border-gray-200 object-cover"
                />
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save"
                  : "Create Category"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
