import {
  formatAppIsoDate,
  formatAppTimeMinutes,
} from "@/lib/datetime/app-timezone";

type AdminOrderPlacedAtProps = {
  placedAt: string | Date;
};

function toIsoDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

/** Admin orders table: clock time primary, calendar date secondary (app TZ). */
export function AdminOrderPlacedAt({ placedAt }: AdminOrderPlacedAtProps) {
  return (
    <time
      dateTime={toIsoDateTime(placedAt)}
      className="flex flex-col items-start gap-0.5 tabular-nums"
    >
      <span className="text-base font-semibold text-gray-900">
        {formatAppTimeMinutes(placedAt)}
      </span>
      <span className="text-xs text-gray-500">{formatAppIsoDate(placedAt)}</span>
    </time>
  );
}
