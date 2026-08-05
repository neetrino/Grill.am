"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CONTENT_CARD_CLASS,
  ADMIN_CONTENT_CARD_GRID,
  ADMIN_CONTENT_CARD_STATUS_CLASS,
} from "@/features/admin/ui/admin-ui";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { deleteBlogPostAction } from "@/features/blog/application/manage-blog";
import type { AdminBlogListItem } from "@/features/blog/application/queries";
import { BlogPostDrawer } from "@/features/blog/ui/BlogPostDrawer";

type AdminBlogViewProps = {
  locale: string;
  posts: AdminBlogListItem[];
};

function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "PUBLISHED") return "bg-green-100 text-green-800";
  if (normalized === "DRAFT") return "bg-yellow-100 text-yellow-800";
  if (normalized === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

export function AdminBlogView({ locale, posts }: AdminBlogViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.blog;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogListItem | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((post) => {
      const haystack = `${post.title} ${post.slug} ${post.excerpt}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [posts, query]);

  function statusLabel(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === "PUBLISHED") return copy.status.published;
    if (normalized === "DRAFT") return copy.status.draft;
    if (normalized === "ARCHIVED") return copy.status.archived;
    return status;
  }

  function openCreate(): void {
    setEditingPost(null);
    setDrawerOpen(true);
  }

  function openEdit(post: AdminBlogListItem): void {
    setEditingPost(post);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
  }

  function handleDelete(postId: string): void {
    void (async () => {
      const accepted = await confirmDelete({
        title: dictionary.common.confirmDeleteTitle,
        message: copy.confirmDelete,
        confirmText: dictionary.common.delete,
        cancelText: dictionary.common.cancel,
      });
      if (!accepted) return;

      startTransition(async () => {
        setError(null);
        const result = await deleteBlogPostAction(locale, { postId });
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        router.refresh();
      });
    })();
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <Button type="button" size="sm" onClick={openCreate}>
          {copy.addPost}
        </Button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.searchPlaceholder}
        className={`${ADMIN_INPUT} mb-4`}
        aria-label={copy.searchAria}
      />

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      {filtered.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-sm text-gray-600">
            {posts.length === 0 ? copy.empty : copy.emptySearch}
          </p>
        </Card>
      ) : (
        <div className={ADMIN_CONTENT_CARD_GRID}>
          {filtered.map((post) => (
            <Card key={post.id} className={ADMIN_CONTENT_CARD_CLASS}>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                {post.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-medium text-white/70">
                    {copy.title}
                  </div>
                )}
                <span
                  className={`${ADMIN_BADGE} ${ADMIN_CONTENT_CARD_STATUS_CLASS} ${statusBadgeClass(post.status)}`}
                >
                  {statusLabel(post.status)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold text-gray-900">
                    {post.title}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openEdit(post)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                      aria-label={formatAdminMessage(copy.editNamed, {
                        title: post.title,
                      })}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(post.id)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      aria-label={formatAdminMessage(copy.deleteNamed, {
                        title: post.title,
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {post.excerpt ? (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {post.excerpt}
                  </p>
                ) : null}
                <p className="truncate text-xs text-gray-500">
                  {post.path}
                  {post.publishedAt ? ` · ${post.publishedAt}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BlogPostDrawer
        key={editingPost?.id ?? "new"}
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        post={editingPost}
      />
    </section>
  );
}
