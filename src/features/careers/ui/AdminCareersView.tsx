"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_INPUT,
  ADMIN_PAGE_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { deleteJobPostingAction } from "@/features/careers/application/manage-job";
import type { AdminJobListItem } from "@/features/careers/application/queries";
import { JobPostingDrawer } from "@/features/careers/ui/JobPostingDrawer";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminCareersViewProps = {
  locale: string;
  postings: AdminJobListItem[];
};

function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE") return "bg-green-100 text-green-800";
  if (normalized === "DRAFT") return "bg-yellow-100 text-yellow-800";
  if (normalized === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

export function AdminCareersView({ locale, postings }: AdminCareersViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.careers;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<AdminJobListItem | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return postings;
    return postings.filter((posting) => {
      const haystack =
        `${posting.title} ${posting.slug} ${posting.summary} ${posting.location}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [postings, query]);

  function statusLabel(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === "ACTIVE") return copy.status.active;
    if (normalized === "DRAFT") return copy.status.draft;
    if (normalized === "ARCHIVED") return copy.status.archived;
    return status;
  }

  function employmentLabel(type: string): string {
    switch (type) {
      case "FULL_TIME":
        return copy.employment.fullTime;
      case "PART_TIME":
        return copy.employment.partTime;
      case "CONTRACT":
        return copy.employment.contract;
      case "INTERNSHIP":
        return copy.employment.internship;
      default:
        return type;
    }
  }

  function openCreate(): void {
    setEditingPosting(null);
    setDrawerOpen(true);
  }

  function openEdit(posting: AdminJobListItem): void {
    setEditingPosting(posting);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingPosting(null);
  }

  function handleDelete(postingId: string): void {
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
        const result = await deleteJobPostingAction(locale, { postingId });
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
        <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
        <Button type="button" size="sm" onClick={openCreate}>
          {copy.addPosition}
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

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="rounded-xl p-8">
            <p className="text-center text-sm text-gray-600">
              {postings.length === 0 ? copy.empty : copy.emptySearch}
            </p>
          </Card>
        ) : (
          filtered.map((posting) => (
            <Card key={posting.id} className="rounded-xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-3">
                  {posting.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin list thumbnail
                    <img
                      src={posting.coverUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      {copy.noImage}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {posting.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {employmentLabel(posting.employmentType)}
                      {posting.location ? ` · ${posting.location}` : ""}
                      {posting.salaryAmount != null
                        ? ` · ${formatMoneyAmount(posting.salaryAmount, posting.salaryCurrency, locale)}`
                        : ""}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {posting.path}
                      {posting.publishedAt ? ` · ${posting.publishedAt}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                  <span
                    className={`${ADMIN_BADGE} ${statusBadgeClass(posting.status)}`}
                  >
                    {statusLabel(posting.status)}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => openEdit(posting)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                    aria-label={formatAdminMessage(copy.editNamed, {
                      title: posting.title,
                    })}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(posting.id)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    aria-label={formatAdminMessage(copy.deleteNamed, {
                      title: posting.title,
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {drawerOpen ? (
        <JobPostingDrawer
          key={editingPosting?.id ?? "new"}
          locale={locale}
          open
          onClose={closeDrawer}
          posting={editingPosting}
        />
      ) : null}
    </section>
  );
}
