"use client";

import { useState } from "react";

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

export type DashboardTrendTooltipCopy = {
  revenueLabel: string;
  ordersLabel: string;
  formatRevenue: (amount: number) => string;
  formatOrders: (count: number) => string;
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

/** Centers each point in its slot so first/last bars stay clear of axis labels. */
function xForIndex(
  index: number,
  pointCount: number,
  paddingLeft: number,
  plotWidth: number,
): number {
  const count = Math.max(pointCount, 1);
  const slotWidth = plotWidth / count;
  return paddingLeft + slotWidth * (index + 0.5);
}

/** Skip dense day labels so ticks do not pile on each other. */
function shouldShowDayLabel(index: number, pointCount: number): boolean {
  if (pointCount <= 14) {
    return true;
  }
  if (pointCount <= 31) {
    return index % 2 === 0 || index === pointCount - 1;
  }
  const step = Math.ceil(pointCount / 12);
  return index % step === 0 || index === pointCount - 1;
}

type DashboardTrendSvgProps = {
  points: DashboardTrendPoint[];
  chartAria: string;
  locale?: Locale;
  /** When set, hovering a day/month shows a detail card. */
  tooltip?: DashboardTrendTooltipCopy;
};

export function DashboardTrendSvg({
  points,
  chartAria,
  locale = defaultLocale,
  tooltip,
}: DashboardTrendSvgProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const daily = isDailySeries(points);
  const width = 720;
  const height = daily ? 236 : 220;
  const padding = {
    top: 16,
    right: 44,
    bottom: daily ? 52 : 36,
    left: 56,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const monthBands = daily ? buildMonthBands(points, locale) : [];
  const pointCount = Math.max(points.length, 1);
  const slotWidth = plotWidth / pointCount;

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
    return { x, y, point, index };
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

  const barWidth = Math.min(22, Math.max(6, slotWidth * 0.5));

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    revenue: Math.round(maxRevenue * ratio),
    orders: Math.round(maxOrders * ratio),
  }));

  const hovered = revenuePoints.find((entry) => entry.point.key === hoveredKey);
  const tooltipEnabled = Boolean(tooltip);

  return (
    <div
      className="relative mx-auto w-full max-w-4xl"
      onMouseLeave={() => {
        setHoveredKey(null);
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-56 w-full sm:h-64"
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
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="10"
              >
                {formatAxisAmount(tick.revenue)}
              </text>
              <text
                x={width - padding.right + 8}
                y={y + 3}
                textAnchor="start"
                fill="#9CA3AF"
                fontSize="10"
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
          const active = point.key === hoveredKey;
          return (
            <rect
              key={`bar-${point.key}`}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, point.orderCount > 0 ? 2 : 0)}
              rx={5}
              fill={DASHBOARD_ORDERS_COLOR}
              opacity={active ? 1 : 0.85}
            />
          );
        })}

        <path d={areaPath} fill="url(#dashboardRevenueFill)" />
        <path
          d={linePath}
          fill="none"
          stroke={DASHBOARD_REVENUE_COLOR}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered ? (
          <line
            x1={hovered.x}
            y1={padding.top}
            x2={hovered.x}
            y2={padding.top + plotHeight}
            stroke="#D1D5DB"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        ) : null}

        {revenuePoints.map((entry) => {
          const active = entry.point.key === hoveredKey;
          return (
            <circle
              key={`dot-${entry.point.key}`}
              cx={entry.x}
              cy={entry.y}
              r={active ? 6 : 4}
              fill={DASHBOARD_REVENUE_COLOR}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {tooltipEnabled
          ? revenuePoints.map((entry) => (
              <rect
                key={`hit-${entry.point.key}`}
                x={entry.x - slotWidth / 2}
                y={padding.top}
                width={slotWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredKey(entry.point.key);
                }}
              />
            ))
          : null}

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
                  fill="#6B7280"
                  fontSize="11"
                  fontWeight="500"
                >
                  {band.label}
                </text>
              );
            })
          : null}

        {revenuePoints.map((entry) => {
          if (daily && !shouldShowDayLabel(entry.index, points.length)) {
            return null;
          }
          return (
            <text
              key={`tick-${entry.point.key}`}
              x={entry.x}
              y={daily ? height - 12 : height - 14}
              textAnchor="middle"
              fill={daily ? "#9CA3AF" : "#6B7280"}
              fontSize={daily ? 9 : 11}
            >
              {daily ? dayNumberFromIso(entry.point.key) : entry.point.label}
            </text>
          );
        })}
      </svg>

      {hovered && tooltip ? (
        <div
          className={`pointer-events-none absolute z-10 min-w-[10.5rem] -translate-x-1/2 rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-black/5 ${
            hovered.y < 72
              ? "translate-y-3"
              : "-translate-y-[calc(100%+10px)]"
          }`}
          style={{
            left: `${Math.min(88, Math.max(12, (hovered.x / width) * 100))}%`,
            top: `${(hovered.y / height) * 100}%`,
          }}
          role="tooltip"
        >
          <p className="text-xs font-semibold text-gray-900">
            {hovered.point.label}
          </p>
          <div className="mt-1.5 space-y-1 text-[11px] leading-snug text-gray-600">
            <p className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: DASHBOARD_REVENUE_COLOR }}
                aria-hidden
              />
              <span>
                {tooltip.revenueLabel}:{" "}
                <span className="font-semibold text-gray-900">
                  {tooltip.formatRevenue(hovered.point.revenueAmount)}
                </span>
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: DASHBOARD_ORDERS_COLOR }}
                aria-hidden
              />
              <span>
                {tooltip.ordersLabel}:{" "}
                <span className="font-semibold text-gray-900">
                  {tooltip.formatOrders(hovered.point.orderCount)}
                </span>
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
