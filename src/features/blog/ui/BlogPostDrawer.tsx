"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import {
  ADMIN_FIELD,
  ADMIN_FORM_STACK,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
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

const BLOG_POST_DRAWER_FORM_ID = "blog-post-drawer-form";

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

  const draft = drafts[activeLocale];
  const drawerTitle = isEdit ? copy.editTitle : copy.addTitle;

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={drawerTitle}
      closeLabel={common.close}
      footer={
        <div className="border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={BLOG_POST_DRAWER_FORM_ID}
            className="w-full"
            disabled={isPending}
          >
            {isPending ? common.saving : common.save}
          </Button>
        </div>
      }
    >
      <form
        id={BLOG_POST_DRAWER_FORM_ID}
        className={`${ADMIN_FORM_STACK} gap-6`}
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
        <AdminLocaleTabs
              activeLocale={activeLocale}
              onChange={setActiveLocale}
              disabled={isPending}
            />

            <label className={ADMIN_FIELD}>
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

            <label className={ADMIN_FIELD}>
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

            <label className={ADMIN_FIELD}>
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
              <div className={ADMIN_FORM_STACK}>
                <div className={ADMIN_FIELD}>
                  <DateField
                    label={copy.publicationDate}
                    value={publishedAt}
                    onChange={setPublishedAt}
                    disabled={isPending}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    {copy.publicationHint}
                  </span>
                </div>
                <AdminSelect
                  label={copy.status}
                  placeholder={copy.status}
                  options={[
                    { value: "DRAFT", label: statusCopy.draft },
                    { value: "PUBLISHED", label: statusCopy.published },
                    { value: "ARCHIVED", label: statusCopy.archived },
                  ]}
                  value={status}
                  disabled={isPending}
                  onChange={(value) => setStatus(value as BlogPostStatus)}
                />
              </div>
            </div>

            <div>
              <span className={ADMIN_LABEL}>{copy.coverImage}</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className={ADMIN_BTN_DASHED_CLASS}
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
      </form>
    </SideSheet>
  );
}
