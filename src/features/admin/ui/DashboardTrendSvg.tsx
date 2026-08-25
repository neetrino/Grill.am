import type { DashboardTrendPoint } from "@/features/analytics/domain/dashboard-periods";
import { formatAnalyticsMonthShort } from "@/features/analytics/domain/date-range";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export const DASHBOARD_REVENUE_COLOR = "#db0b20";
export const DASHBOARD_ORDERS_COLOR = "#ffc12c";

const ISO_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type MonthBand = {
  monthKey: string;
  label: string;
  startIndex: number;
  endIndex: number;
};

function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  if (normalized <= 1) {
    return magnitude;
  }
  if (normalized <= 2) {
    return 2 * magnitude;
  }
  if (normalized <= 5) {
    return 5 * magnitude;
  }
  return 10 * magnitude;
}

/** Compact axis labels for large AMD totals (e.g. 12.5k). */
function formatAxisAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  }
  return String(Math.round(amount));
}

function isDailyIsoKey(key: string): boolean {
  return ISO_DAY_KEY_PATTERN.test(key);
}

function isDailySeries(points: DashboardTrendPoint[]): boolean {
  return points.length > 0 && points.every((point) => isDailyIsoKey(point.key));
}

function dayNumberFromIso(isoDate: string): string {
  return String(Number(isoDate.slice(8, 10)));
}

/** Groups contiguous daily points by calendar month for axis headers. */
function buildMonthBands(
  points: DashboardTrendPoint[],
  locale: Locale,
): MonthBand[] {
  const bands: MonthBand[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!point) {
      continue;
    }
    const monthKey = point.key.slice(0, 7);
    const last = bands[bands.length - 1];
    if (last && last.monthKey === monthKey) {
      last.endIndex = index;
      continue;
    }
    bands.push({
      monthKey,
      label: formatAnalyticsMonthShort(point.key, locale),
      startIndex: index,
      endIndex: index,
    });
  }

  return bands;
}

function xForIndex(
  index: number,
  pointCount: number,
  paddingLeft: number,
  plotWidth: number,
): number {
  if (pointCount === 1) {
    return paddingLeft + plotWidth / 2;
  }
  return paddingLeft + (index / (pointCount - 1)) * plotWidth;
}

type DashboardTrendSvgProps = {
  points: DashboardTrendPoint[];
  chartAria: string;
  locale?: Locale;
};

export function DashboardTrendSvg({
  points,
  chartAria,
  locale = defaultLocale,
}: DashboardTrendSvgProps) {
  const daily = isDailySeries(points);
  const width = 720;
  const height = daily ? 300 : 280;
  const padding = {
    top: 12,
    right: 36,
    bottom: daily ? 48 : 32,
    left: 44,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const monthBands = daily ? buildMonthBands(points, locale) : [];

  const maxRevenue = niceCeiling(
    Math.max(...points.map((point) => point.revenueAmount), 1),
  );
  const maxOrders = niceCeiling(
    Math.max(...points.map((point) => point.orderCount), 1),
  );

  const revenuePoints = points.map((point, index) => {
    const x = xForIndex(index, points.length, padding.left, plotWidth);
    const y =
      padding.top +
      plotHeight -
      (point.revenueAmount / maxRevenue) * plotHeight;
    return { x, y, point };
  });

  const linePath = revenuePoints
    .map(
      (entry, index) =>
        `${index === 0 ? "M" : "L"} ${entry.x.toFixed(1)} ${entry.y.toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${revenuePoints[revenuePoints.length - 1]?.x ?? padding.left} ${
    padding.top + plotHeight
  } L ${revenuePoints[0]?.x ?? padding.left} ${padding.top + plotHeight} Z`;

  const barWidth = Math.min(
    28,
    Math.max(10, (plotWidth / Math.max(points.length, 1)) * 0.45),
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    revenue: Math.round(maxRevenue * ratio),
    orders: Math.round(maxOrders * ratio),
  }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-full min-h-[18rem] w-full sm:min-h-[20rem]"
      role="img"
      aria-label={chartAria}
    >
      <defs>
        <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={DASHBOARD_REVENUE_COLOR}
            stopOpacity="0.28"
          />
          <stop
            offset="100%"
            stopColor={DASHBOARD_REVENUE_COLOR}
            stopOpacity="0.02"
          />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = padding.top + plotHeight - tick.ratio * plotHeight;
        return (
          <g key={tick.ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-gray-400 text-[10px]"
            >
              {formatAxisAmount(tick.revenue)}
            </text>
            <text
              x={width - padding.right + 10}
              y={y + 4}
              textAnchor="start"
              className="fill-gray-400 text-[10px]"
            >
              {tick.orders}
            </text>
          </g>
        );
      })}

      {points.map((point, index) => {
        const x = xForIndex(index, points.length, padding.left, plotWidth);
        const barHeight = (point.orderCount / maxOrders) * plotHeight;
        const y = padding.top + plotHeight - barHeight;
        return (
          <rect
            key={`bar-${point.key}`}
            x={x - barWidth / 2}
            y={y}
            width={barWidth}
            height={Math.max(barHeight, point.orderCount > 0 ? 2 : 0)}
            rx={6}
            fill={DASHBOARD_ORDERS_COLOR}
            opacity={0.85}
          />
        );
      })}

      <path d={areaPath} fill="url(#dashboardRevenueFill)" />
      <path
        d={linePath}
        fill="none"
        stroke={DASHBOARD_REVENUE_COLOR}
        strokeWidth="2.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {revenuePoints.map((entry) => (
        <circle
          key={`dot-${entry.point.key}`}
          cx={entry.x}
          cy={entry.y}
          r="5"
          fill={DASHBOARD_REVENUE_COLOR}
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {daily
        ? monthBands.map((band) => {
            const startX = xForIndex(
              band.startIndex,
              points.length,
              padding.left,
              plotWidth,
            );
            const endX = xForIndex(
              band.endIndex,
              points.length,
              padding.left,
              plotWidth,
            );
            return (
              <text
                key={`month-${band.monthKey}`}
                x={(startX + endX) / 2}
                y={height - 30}
                textAnchor="middle"
                className="fill-gray-500 text-[11px] font-medium"
              >
                {band.label}
              </text>
            );
          })
        : null}

      {revenuePoints.map((entry) => (
        <text
          key={`tick-${entry.point.key}`}
          x={entry.x}
          y={daily ? height - 12 : height - 14}
          textAnchor="middle"
          className={
            daily
              ? "fill-gray-400 text-[9px]"
              : "fill-gray-500 text-[11px]"
          }
        >
          {daily ? dayNumberFromIso(entry.point.key) : entry.point.label}
        </text>
      ))}
    </svg>
  );
}
