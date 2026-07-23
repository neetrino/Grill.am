"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { archiveOrderAction } from "@/features/orders/application/archive-order";

type ArchiveOrderButtonProps = {
  locale: string;
  orderNumber: string;
  isArchived: boolean;
};

export function ArchiveOrderButton({
  locale,
  orderNumber,
  isArchived,
}: ArchiveOrderButtonProps) {
  const dictionary = useAdminDictionary();
  const forms = dictionary.orders.forms;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3">
        <h2 className={ADMIN_SECTION_TITLE}>{forms.archive}</h2>
        <p className="text-sm text-gray-600">
          {isArchived ? forms.archivedHint : forms.archiveHint}
        </p>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              setError(null);
              const result = await archiveOrderAction(locale, {
                orderNumber,
                archive: !isArchived,
              });

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              router.refresh();
            });
          }}
        >
          {isPending
            ? common.saving
            : isArchived
              ? forms.restoreOrder
              : forms.archiveOrder}
        </Button>
      </div>
    </Card>
  );
}
