import { AdminTableDateTime } from "@/features/admin/ui/AdminTableDateTime";

type AdminOrderPlacedAtProps = {
  placedAt: string | Date;
};

/** Admin orders table datetime cell. */
export function AdminOrderPlacedAt({ placedAt }: AdminOrderPlacedAtProps) {
  return <AdminTableDateTime value={placedAt} />;
}
