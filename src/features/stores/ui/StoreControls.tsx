"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  deleteStoreAction,
  toggleStoreAction,
} from "@/features/stores/application/manage-stores";

type StoreControlsProps = {
  locale: string;
  storeId: string;
  storeTitle: string;
  isActive: boolean;
  onEdit: () => void;
};

export function StoreControls({
  locale,
  storeId,
  storeTitle,
  isActive,
  onEdit,
}: StoreControlsProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.stores;
  const common = dictionary.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ ok: boolean; error?: { message: string } }>,
  ): void {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error?.message ?? common.actionsFailed);
        return;
      }
      router.refresh();
    });
  }

  function onDelete(): void {
    void (async () => {
      const accepted = await confirmDelete({
        title: common.confirmDeleteTitle,
        message: formatAdminMessage(copy.confirmDelete, { title: storeTitle }),
        confirmText: common.delete,
        cancelText: common.cancel,
      });
      if (!accepted) return;
      run(() => deleteStoreAction(locale, { storeId }));
    })();
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="inline-flex items-center justify-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={onEdit}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          aria-label={formatAdminMessage(copy.editNamed, { title: storeTitle })}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onDelete}
          className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
          aria-label={formatAdminMessage(copy.deleteNamed, {
            title: storeTitle,
          })}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          disabled={isPending}
          onClick={() =>
            run(() =>
              toggleStoreAction(locale, {
                storeId,
                isActive: !isActive,
              }),
            )
          }
          className={`relative ml-1 h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
            isActive ? "bg-green-500" : "bg-gray-300"
          }`}
          aria-label={isActive ? copy.unpublish : copy.publish}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              isActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
