"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  deletePopupAction,
  togglePopupAction,
} from "@/features/popups/application/manage-popups";

type PopupControlsProps = {
  locale: string;
  popupId: string;
  isActive: boolean;
  onEdit: () => void;
};

export function PopupControls({
  locale,
  popupId,
  isActive,
  onEdit,
}: PopupControlsProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.popups;
  const common = dictionary.common;
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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={onEdit}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          aria-label={copy.edit}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() => deletePopupAction(locale, { popupId }))
          }
          className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
          aria-label={formatAdminMessage(copy.deleteNamed, { id: popupId })}
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
              togglePopupAction(locale, {
                popupId,
                isActive: !isActive,
              }),
            )
          }
          className={`relative ml-1 h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
            isActive ? "bg-green-500" : "bg-gray-300"
          }`}
          aria-label={isActive ? copy.deactivate : copy.activate}
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
