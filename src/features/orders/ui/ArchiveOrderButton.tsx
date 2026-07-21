"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3">
        <h2 className={ADMIN_SECTION_TITLE}>Archive</h2>
        <p className="text-sm text-gray-600">
          {isArchived
            ? "This order is archived. Restore it to show in default lists."
            : "Archive hides the order from default admin lists without deleting data."}
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
            ? "Saving…"
            : isArchived
              ? "Restore order"
              : "Archive order"}
        </Button>
      </div>
    </Card>
  );
}
