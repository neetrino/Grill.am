"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SELECT,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/application/manage-blog";
import type { AdminBlogListItem } from "@/features/blog/application/queries";
import {
  normalizeBlogSlug,
  type BlogPostStatus,
  type BlogTranslations,
} from "@/features/blog/domain/blog-rules";
import { locales, type Locale } from "@/lib/i18n/config";

type LocaleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  slugTouched: boolean;
};

type BlogPostDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  post?: AdminBlogListItem | null;
};

function emptyDraft(): LocaleDraft {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    slugTouched: false,
  };
}

function draftsFromTranslations(
  translations: BlogTranslations | undefined,
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
      slug: copy.slug,
      excerpt: copy.excerpt ?? "",
      content: copy.content,
      slugTouched: true,
    };
  }

  return next;
}

function resolvedSlug(draft: LocaleDraft): string {
  if (draft.slugTouched && draft.slug.trim()) {
    return normalizeBlogSlug(draft.slug);
  }
  const fromTitle = normalizeBlogSlug(draft.title);
  return fromTitle || `post-${Date.now().toString(36)}`;
}

export function BlogPostDrawer({
  locale,
  open,
  onClose,
  post = null,
}: BlogPostDrawerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.blog.drawer;
  const statusCopy = dictionary.blog.status;
  const common = dictionary.common;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = post != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    if (!post) return "en";
    return (
      (locales.find((loc) => post.translations[loc]?.title) as
        | Locale
        | undefined) ?? "en"
    );
  });
  const [drafts, setDrafts] = useState<Record<Locale, LocaleDraft>>(() =>
    draftsFromTranslations(post?.translations),
  );
  const [status, setStatus] = useState<BlogPostStatus>(
    () => post?.status ?? "DRAFT",
  );
  const [publishedAt, setPublishedAt] = useState(
    () => post?.publishedAt ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => post?.coverUrl ?? null,
  );
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

  if (!open) return null;

  const draft = drafts[activeLocale];
  const drawerTitle = isEdit ? copy.editTitle : copy.addTitle;

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={drawerTitle}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{drawerTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const current = drafts[activeLocale];
            const slug = resolvedSlug(current);
            if (!current.title.trim() || !current.content.trim()) {
              setError(copy.titleRequired);
              return;
            }

            startTransition(async () => {
              setError(null);
              const payload = {
                editingLocale: activeLocale,
                title: current.title,
                slug,
                excerpt: current.excerpt || undefined,
                content: current.content,
                status,
                publishedAt: publishedAt || null,
                tags: post?.tags.join(", ") ?? "",
              };
              const mediaForm = new FormData();
              if (imageFile) {
                mediaForm.set("image", imageFile);
              }
              if (removeExistingImage) {
                mediaForm.set("removeImage", "1");
              }

              const result =
                isEdit && post
                  ? await updateBlogPostAction(
                      locale,
                      post.id,
                      payload,
                      mediaForm,
                    )
                  : await createBlogPostAction(locale, payload, mediaForm);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <AdminLocaleTabs
              activeLocale={activeLocale}
              onChange={setActiveLocale}
              disabled={isPending}
            />

            <label className="block">
              <span className={ADMIN_LABEL}>
                {copy.title} <span className="text-red-600">*</span>
              </span>
              <input
                required
                value={draft.title}
                onChange={(event) =>
                  updateDraft({ title: event.target.value })
                }
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>{copy.excerpt}</span>
              <input
                value={draft.excerpt}
                onChange={(event) =>
                  updateDraft({ excerpt: event.target.value })
                }
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>

            <label className="block">
              <span className={ADMIN_LABEL}>
                {copy.content} <span className="text-red-600">*</span>
              </span>
              <textarea
                required
                rows={8}
                value={draft.content}
                onChange={(event) =>
                  updateDraft({ content: event.target.value })
                }
                className={ADMIN_TEXTAREA}
                disabled={isPending}
              />
              <span className="mt-1 block text-xs text-gray-500">
                {copy.contentHint}
              </span>
            </label>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {copy.common}
              </p>
              <div className="space-y-4">
                <label className="block">
                  <span className={ADMIN_LABEL}>{copy.publicationDate}</span>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    className={ADMIN_INPUT}
                    disabled={isPending}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    {copy.publicationHint}
                  </span>
                </label>
                <label className="block">
                  <span className={ADMIN_LABEL}>{copy.status}</span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as BlogPostStatus)
                    }
                    className={ADMIN_SELECT}
                    disabled={isPending}
                  >
                    <option value="DRAFT">{statusCopy.draft}</option>
                    <option value="PUBLISHED">{statusCopy.published}</option>
                    <option value="ARCHIVED">{statusCopy.archived}</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <span className={ADMIN_LABEL}>{copy.coverImage}</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  {imagePreview ? copy.changeImage : copy.uploadImage}
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
                      if (isEdit && post?.coverUrl) {
                        setRemoveExistingImage(true);
                      }
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-red-600"
                  >
                    {common.remove}
                  </button>
                ) : null}
              </div>
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
                <img
                  src={imagePreview}
                  alt=""
                  className="mt-3 h-28 w-28 rounded-xl border border-gray-200 object-cover"
                />
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                {copy.imageHint}
              </p>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className="border-t border-gray-200 px-5 py-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? common.saving : common.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
