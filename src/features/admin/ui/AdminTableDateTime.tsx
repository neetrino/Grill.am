import {
  formatAppDisplayDate,
  formatAppTimeMinutes,
} from "@/lib/datetime/app-timezone";

type AdminTableDateTimeProps = {
  value: string | Date;
};

function toIsoDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

/** Admin table datetime: clock time primary, calendar date secondary (app TZ). */
export function AdminTableDateTime({ value }: AdminTableDateTimeProps) {
  return (
    <time
      dateTime={toIsoDateTime(value)}
      className="inline-flex flex-col items-center gap-0.5 tabular-nums"
    >
      <span className="text-base font-semibold text-gray-900">
        {formatAppTimeMinutes(value)}
      </span>
      <span className="text-xs text-gray-500">{formatAppDisplayDate(value)}</span>
    </time>
  );
}
