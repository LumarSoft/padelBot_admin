"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Landmark,
  Loader2,
  QrCode,
  ShoppingBasket,
  AlertCircle,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { statsService } from "@/services/stats.service";
import { todayKey } from "@/features/agenda/lib/schedule";
import type { OccupancyReport, RevenueDay, RevenueReport } from "@/types/api/stats";

// ── Shared constants ──────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const WEEKDAYS_ORDERED = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

/** Revenue channels — consistent colors across the entire screen. */
const CHANNELS = [
  {
    key: "depositCents" as const,
    totalKey: "totalDepositCents" as const,
    label: "Señas",
    barClass: "bg-brand/80",
    dotClass: "bg-brand",
    textClass: "text-brand",
    icon: Landmark,
  },
  {
    key: "productsCents" as const,
    totalKey: "totalProductsCents" as const,
    label: "Kiosco",
    barClass: "bg-violet-500/70",
    dotClass: "bg-violet-500",
    textClass: "text-violet-600 dark:text-violet-400",
    icon: ShoppingBasket,
  },
  {
    key: "cashCents" as const,
    totalKey: "totalCashCents" as const,
    label: "Efectivo",
    barClass: "bg-emerald-500/70",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
    icon: Banknote,
  },
  {
    key: "qrCents" as const,
    totalKey: "totalQrCents" as const,
    label: "QR",
    barClass: "bg-amber-500/70",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
    icon: QrCode,
  },
];

// ── Date range helpers ────────────────────────────────────────────────────────

type RangeMode = "month" | "custom";

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last N months as { label, from, to } objects. */
function lastMonths(n: number) {
  const result: { label: string; from: string; to: string; key: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = toDateKey(d);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const to = toDateKey(lastDay);
    const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    result.push({ label: label.charAt(0).toUpperCase() + label.slice(1), from, to, key: from.slice(0, 7) });
  }
  return result;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function dayTotal(d: RevenueDay): number {
  return d.depositCents + d.productsCents + d.cashCents + d.qrCents;
}

function formatShortDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

function friendlyDate(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function computeTrend(
  days: RevenueDay[],
): { direction: "up" | "down" | "flat"; pct: number } | null {
  if (days.length < 6) return null;
  const mid = Math.floor(days.length / 2);
  const first = days.slice(0, mid).reduce((s, d) => s + dayTotal(d), 0);
  const second = days.slice(mid).reduce((s, d) => s + dayTotal(d), 0);
  if (first === 0) return null;
  const pct = Math.round(((second - first) / first) * 100);
  return {
    direction: pct > 3 ? "up" : pct < -3 ? "down" : "flat",
    pct: Math.abs(pct),
  };
}

/** Derive occupancy insights — fixed: uses `withRate` array for avgOccupancy. */
function deriveOccupancyInsights(report: OccupancyReport) {
  const meaningful = report.cells.filter((c) => c.offered >= 3);
  if (meaningful.length === 0) return null;

  const withRate = meaningful.map((c) => ({
    ...c,
    rate: c.occupied / c.offered,
  }));

  const sorted = [...withRate].sort((a, b) => b.rate - a.rate);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Best weekday by summed occupancy
  const byDay = new Map<number, { occupied: number; offered: number }>();
  for (const c of meaningful) {
    const prev = byDay.get(c.weekday) ?? { occupied: 0, offered: 0 };
    byDay.set(c.weekday, {
      occupied: prev.occupied + c.occupied,
      offered: prev.offered + c.offered,
    });
  }
  const bestDayEntry = [...byDay.entries()].sort(
    ([, a], [, b]) => b.occupied / b.offered - a.occupied / a.offered,
  )[0];

  // Fixed: use withRate (not meaningful) for average
  const avgOccupancy =
    withRate.reduce((s, c) => s + c.rate, 0) / withRate.length;

  return {
    best: {
      day: WEEKDAY_LABELS[best.weekday],
      band: best.bandStart,
      pct: Math.round(best.rate * 100),
    },
    worst: {
      day: WEEKDAY_LABELS[worst.weekday],
      band: worst.bandStart,
      pct: Math.round(worst.rate * 100),
    },
    bestDay: bestDayEntry
      ? {
          day: WEEKDAY_LABELS[bestDayEntry[0]],
          pct: Math.round(
            (bestDayEntry[1].occupied / bestDayEntry[1].offered) * 100,
          ),
        }
      : null,
    avgOccupancyPct: Math.round(avgOccupancy * 100),
  };
}

// ── Date range picker ─────────────────────────────────────────────────────────

function DateRangePicker({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [mode, setMode] = useState<RangeMode>("month");
  const [open, setOpen] = useState(false);
  const months = useMemo(() => lastMonths(12), []);

  const label = useMemo(() => {
    const from = new Date(range.from + "T12:00:00");
    const to = new Date(range.to + "T12:00:00");
    const sameMonth =
      from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
    if (sameMonth) {
      return from.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
        .replace(/^./, (c) => c.toUpperCase());
    }
    return `${formatShortDate(range.from)} — ${formatShortDate(range.to)}`;
  }, [range]);

  function selectMonth(m: { from: string; to: string }) {
    onChange({ from: m.from, to: m.to });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-200",
          "border-border/80 bg-card/60 backdrop-blur-sm",
          "hover:border-border hover:bg-card/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "border-brand/40 ring-2 ring-brand/15",
        )}
      >
        <CalendarDays className="text-muted-foreground size-3.5" />
        <span className="font-medium">{label}</span>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Mode tabs */}
        <div className="border-b p-1 flex gap-1">
          {(["month", "custom"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "month" ? "Por mes" : "Rango personalizado"}
            </button>
          ))}
        </div>

        {mode === "month" ? (
          <div className="p-2">
            <div className="grid grid-cols-2 gap-1">
              {months.map((m) => {
                const active = m.from === range.from && m.to === range.to;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => selectMonth(m)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-xs transition-colors",
                      active
                        ? "bg-brand/15 text-brand font-semibold"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <input
                type="date"
                value={range.from}
                max={range.to}
                onChange={(e) => onChange({ ...range, from: e.target.value })}
                className={cn(
                  "h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
                  "bg-card/60 border-border/80",
                  "focus:border-brand/40 focus:ring-2 focus:ring-brand/15",
                  "transition-all duration-200",
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <input
                type="date"
                value={range.to}
                min={range.from}
                max={todayKey()}
                onChange={(e) => onChange({ ...range, to: e.target.value })}
                className={cn(
                  "h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
                  "bg-card/60 border-border/80",
                  "focus:border-brand/40 focus:ring-2 focus:ring-brand/15",
                  "transition-all duration-200",
                )}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Aplicar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCards({ revenue }: { revenue: RevenueReport }) {
  const grand =
    revenue.totalDepositCents +
    revenue.totalProductsCents +
    revenue.totalCashCents +
    revenue.totalQrCents;

  const avgTicket =
    revenue.totalBookings > 0
      ? Math.round(grand / revenue.totalBookings)
      : 0;

  const trend = computeTrend(revenue.days);

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendClass =
    trend?.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend?.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  const cards = [
    {
      label: "Total recaudado",
      value: formatPrice(grand),
      sub: trend
        ? `${trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"} ${trend.pct}% vs primera mitad del período`
        : null,
      subClass: trendClass,
      icon: TrendIcon,
      iconBg: "bg-brand/10",
      iconText: "text-brand",
    },
    {
      label: "Ticket promedio / turno",
      value: formatPrice(avgTicket),
      sub: `${revenue.totalBookings} turnos confirmados`,
      subClass: "text-muted-foreground",
      icon: null,
      iconBg: "",
      iconText: "",
    },
    {
      label: "Señas",
      value: formatPrice(revenue.totalDepositCents),
      sub: grand > 0 ? `${Math.round((revenue.totalDepositCents / grand) * 100)}% del total` : null,
      subClass: "text-brand",
      icon: Landmark,
      iconBg: "bg-brand/10",
      iconText: "text-brand",
    },
    {
      label: "Kiosco",
      value: formatPrice(revenue.totalProductsCents),
      sub: grand > 0 ? `${Math.round((revenue.totalProductsCents / grand) * 100)}% del total` : null,
      subClass: "text-violet-600 dark:text-violet-400",
      icon: ShoppingBasket,
      iconBg: "bg-violet-500/10",
      iconText: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Mostrador",
      value: formatPrice(revenue.totalCashCents + revenue.totalQrCents),
      sub: `Efec. ${formatPrice(revenue.totalCashCents)} · QR ${formatPrice(revenue.totalQrCents)}`,
      subClass: "text-muted-foreground",
      icon: Banknote,
      iconBg: "bg-emerald-500/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ label, value, sub, subClass, icon: Icon, iconBg, iconText }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground text-xs leading-snug">{label}</p>
              {Icon && (
                <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", iconBg)}>
                  <Icon className={cn("size-3.5", iconText)} />
                </div>
              )}
            </div>
            <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
            {sub && (
              <p className={cn("mt-1 flex items-center gap-1 text-[11px] leading-snug", subClass)}>
                {sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Revenue chart (SVG line + bars) ──────────────────────────────────────────

/**
 * A clean bar chart per day with an SVG trend line overlay.
 * Much easier to read than stacked bars at scale.
 */
function RevenueChart({ days }: { days: RevenueDay[] }) {
  const totals = useMemo(() => days.map(dayTotal), [days]);
  const maxTotal = useMemo(() => Math.max(1, ...totals), [totals]);

  const W = 600; // viewBox width
  const H = 120; // viewBox chart height (bars)
  const barW = Math.max(2, (W / days.length) - 1);
  const gap = W / days.length;

  // Smooth line path through daily totals
  const points = totals.map((v, i) => ({
    x: i * gap + gap / 2,
    y: H - (v / maxTotal) * (H - 4),
  }));

  // Cardinal spline (catmull-rom simplified)
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  // Label density
  const labelStep = days.length <= 10 ? 1 : days.length <= 35 ? 5 : 14;

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {CHANNELS.map(({ label, dotClass }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs">
            <span className={cn("size-2 rounded-sm", dotClass)} />
            <span className="text-muted-foreground">{label}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs">
          <span className="inline-block h-px w-4 bg-brand/60 [border-top:2px_dashed]" />
          <span className="text-muted-foreground">Tendencia</span>
        </span>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Bar columns */}
        <div className="flex h-28 items-end gap-px">
          {days.map((day, i) => {
            const total = totals[i];
            const showLabel = i % labelStep === 0;

            // Stacked segments as inline flex column
            const CHART_H = 96; // px, inner bar area (excluding label row)
            const barH = total > 0 ? Math.max(3, (total / maxTotal) * CHART_H) : 1;

            return (
              <div
                key={day.dateKey}
                className="group/col flex flex-1 flex-col items-center justify-end"
                title={[
                  friendlyDate(day.dateKey),
                  `Total: ${formatPrice(total)}`,
                  ...CHANNELS.filter((ch) => day[ch.key] > 0).map(
                    (ch) => `${ch.label}: ${formatPrice(day[ch.key])}`,
                  ),
                ].join("\n")}
              >
                {/* Hover: total above bar */}
                <span className="mb-0.5 text-[9px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover/col:opacity-100">
                  {total > 0 ? formatPrice(total) : ""}
                </span>

                {/* Stacked bar */}
                <div
                  className="w-full animate-bar-rise origin-bottom overflow-hidden rounded-t-[2px]"
                  style={{ height: `${barH}px`, animationDelay: `${i * 15}ms` }}
                >
                  <div className="flex h-full flex-col-reverse">
                    {CHANNELS.map((ch) => {
                      const segH =
                        total > 0 ? (day[ch.key] / total) * barH : 0;
                      return segH > 0 ? (
                        <div
                          key={ch.key}
                          className={cn("w-full shrink-0", ch.barClass)}
                          style={{ height: `${segH}px` }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Date label */}
                <span
                  className={cn(
                    "mt-0.5 text-[9px] tabular-nums",
                    showLabel ? "text-muted-foreground" : "invisible",
                  )}
                >
                  {formatShortDate(day.dateKey)}
                </span>
              </div>
            );
          })}
        </div>

        {/* SVG trend line overlay */}
        {days.length >= 3 && (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-0 right-0 left-0 h-24 w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(var(--brand))" stopOpacity="0.15" />
                <stop offset="100%" stopColor="oklch(var(--brand))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={areaPath} fill="url(#area-grad)" />
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="oklch(var(--brand))"
              strokeWidth="1.5"
              strokeOpacity="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots on data points */}
            {points.map((pt, i) =>
              totals[i] > 0 ? (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="2"
                  fill="oklch(var(--brand))"
                  fillOpacity="0.8"
                />
              ) : null,
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Payment mix ───────────────────────────────────────────────────────────────

function PaymentMix({ revenue }: { revenue: RevenueReport }) {
  const grand =
    revenue.totalDepositCents +
    revenue.totalProductsCents +
    revenue.totalCashCents +
    revenue.totalQrCents;

  if (grand === 0) return null;

  const rows = CHANNELS.map((ch) => ({
    ...ch,
    cents: revenue[ch.totalKey],
    pct: Math.round((revenue[ch.totalKey] / grand) * 100),
  })).filter((r) => r.cents > 0);

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ key, label, barClass, textClass, icon: Icon, cents, pct }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="flex w-28 shrink-0 items-center gap-2">
            <Icon className="text-muted-foreground size-3.5 shrink-0" />
            <span className="text-sm">{label}</span>
          </div>
          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <div
              className={cn(
                "animate-grow-x h-full origin-left rounded-full",
                barClass,
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-24 text-right text-sm font-medium tabular-nums">
            {formatPrice(cents)}
          </span>
          <span className={cn("w-9 text-right text-xs font-semibold tabular-nums", textClass)}>
            {pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Occupancy insights (data only, no recommendations) ───────────────────────

function OccupancyInsights({ report }: { report: OccupancyReport }) {
  const insights = useMemo(() => deriveOccupancyInsights(report), [report]);

  if (!insights) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
        <AlertCircle className="size-4 shrink-0" />
        Se necesitan al menos 3 semanas de datos para calcular insights de ocupación.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Most demanded slot */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium">Franja más demandada</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {insights.best.pct}%
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            <span className="font-medium text-foreground">{insights.best.day}</span>
            {" · "}
            {insights.best.band}
          </p>
        </div>
      </div>

      {/* Least occupied slot */}
      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Zap className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium">Franja con menor ocupación</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {insights.worst.pct}%
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            <span className="font-medium text-foreground">{insights.worst.day}</span>
            {" · "}
            {insights.worst.band}
          </p>
        </div>
      </div>

      {/* Overall occupancy */}
      <div className="flex flex-col gap-3 rounded-xl border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-brand/10 flex size-7 shrink-0 items-center justify-center rounded-lg">
            <Target className="text-brand size-3.5" />
          </div>
          <p className="text-sm font-medium">Ocupación general</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums">
            {insights.avgOccupancyPct}%
          </p>
          {insights.bestDay && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              Mejor día:{" "}
              <span className="font-medium text-foreground">
                {insights.bestDay.day}
              </span>
              {" "}
              ({insights.bestDay.pct}%)
            </p>
          )}
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-brand animate-grow-x h-full origin-left rounded-full"
            style={{ width: `${Math.min(100, insights.avgOccupancyPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Occupancy heatmap ─────────────────────────────────────────────────────────

function heatColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-600 text-white";
  if (pct >= 60) return "bg-emerald-500/80 text-white";
  if (pct >= 40) return "bg-emerald-400/60";
  if (pct >= 20) return "bg-emerald-300/40";
  if (pct > 0) return "bg-emerald-200/30";
  return "bg-muted/40 text-muted-foreground";
}

function OccupancyHeatmap({ report }: { report: OccupancyReport }) {
  const cellFor = new Map(
    report.cells.map((c) => [`${c.weekday}|${c.bandStart}`, c]),
  );

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-max gap-1"
        style={{
          gridTemplateColumns: `4.5rem repeat(${WEEKDAYS_ORDERED.length}, 4rem)`,
        }}
      >
        <span />
        {WEEKDAYS_ORDERED.map((d) => (
          <span
            key={d.value}
            className="text-muted-foreground text-center text-xs font-medium"
          >
            {d.label}
          </span>
        ))}
        {report.bandStarts.map((bandStart) => (
          <div key={bandStart} className="contents">
            <span className="text-muted-foreground pr-2 text-right text-xs tabular-nums leading-7">
              {bandStart}
            </span>
            {WEEKDAYS_ORDERED.map((d) => {
              const cell = cellFor.get(`${d.value}|${bandStart}`);
              if (!cell || cell.offered === 0) {
                return <span key={d.value} className="h-7 rounded bg-transparent" />;
              }
              const pct = Math.round((cell.occupied / cell.offered) * 100);
              return (
                <span
                  key={d.value}
                  title={`${d.label} ${bandStart}: ${pct}% (${cell.occupied}/${cell.offered})`}
                  className={cn(
                    "flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums",
                    heatColor(pct),
                  )}
                >
                  {pct}%
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Revenue table ─────────────────────────────────────────────────────────────

function RevenueTable({ revenue }: { revenue: RevenueReport }) {
  if (revenue.days.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Día</th>
            <th className="px-3 py-2 text-right font-medium">Turnos</th>
            <th className="px-3 py-2 text-right font-medium text-brand">Señas</th>
            <th className="px-3 py-2 text-right font-medium text-violet-600 dark:text-violet-400">Kiosco</th>
            <th className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">Efec.</th>
            <th className="px-3 py-2 text-right font-medium text-amber-600 dark:text-amber-400">QR</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {revenue.days.map((day) => {
            const t = dayTotal(day);
            return (
              <tr key={day.dateKey} className="border-t transition-colors hover:bg-muted/20">
                <td className="px-3 py-1.5 capitalize">{friendlyDate(day.dateKey)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{day.bookings}</td>
                <td className="text-brand px-3 py-1.5 text-right tabular-nums">
                  {day.depositCents > 0 ? formatPrice(day.depositCents) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-violet-600 dark:text-violet-400">
                  {day.productsCents > 0 ? formatPrice(day.productsCents) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {day.cashCents > 0 ? formatPrice(day.cashCents) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-amber-600 dark:text-amber-400">
                  {day.qrCents > 0 ? formatPrice(day.qrCents) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                  {t > 0 ? formatPrice(t) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-muted/40 border-t-2 text-xs font-semibold">
          <tr>
            <td className="px-3 py-2 text-muted-foreground">TOTAL</td>
            <td className="px-3 py-2 text-right tabular-nums">{revenue.totalBookings}</td>
            <td className="text-brand px-3 py-2 text-right tabular-nums">{formatPrice(revenue.totalDepositCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-violet-600 dark:text-violet-400">{formatPrice(revenue.totalProductsCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatPrice(revenue.totalCashCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{formatPrice(revenue.totalQrCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatPrice(revenue.totalDepositCents + revenue.totalProductsCents + revenue.totalCashCents + revenue.totalQrCents)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function downloadRevenueCsv(revenue: RevenueReport) {
  const header = "fecha,turnos,señas_ars,kiosco_ars,efectivo_ars,qr_ars,total_ars";
  const rows = revenue.days.map((d) => {
    const t = dayTotal(d);
    return [
      d.dateKey,
      d.bookings,
      (d.depositCents / 100).toFixed(2),
      (d.productsCents / 100).toFixed(2),
      (d.cashCents / 100).toFixed(2),
      (d.qrCents / 100).toFixed(2),
      (t / 100).toFixed(2),
    ].join(",");
  });
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ingresos_${revenue.fromDateKey}_${revenue.toDateKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SectionLoader({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ReportsScreen() {
  const today = todayKey();
  const months = useMemo(() => lastMonths(12), []);

  // Default: current month
  const [range, setRange] = useState<DateRange>(() => ({
    from: months[0].from,
    to: months[0].to,
  }));

  const [weeks, setWeeks] = useState("4");

  const occupancyQuery = useQuery({
    queryKey: queryKeys.stats.occupancy(Number(weeks)),
    queryFn: () => statsService.getOccupancy(Number(weeks)),
  });

  const revenueQuery = useQuery({
    queryKey: queryKeys.stats.revenue(range.from, range.to),
    queryFn: () => statsService.getRevenue(range.from, range.to),
  });

  const revenue = revenueQuery.data;
  const hasDays = (revenue?.days.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-10">

      {/* ── 1. Ingresos ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Ingresos</h2>
            <p className="text-muted-foreground text-sm">
              Señas, kiosco y mostrador por período.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker range={range} onChange={setRange} />
            <Button
              variant="outline"
              size="sm"
              disabled={!revenue || !hasDays}
              onClick={() => revenue && downloadRevenueCsv(revenue)}
            >
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        {revenueQuery.isLoading ? (
          <SectionLoader label="Calculando ingresos…" />
        ) : revenue ? (
          hasDays ? (
            <div className="flex flex-col gap-5">
              <KpiCards revenue={revenue} />

              <Card>
                <CardContent className="p-5">
                  <p className="mb-1 font-medium">Ingresos diarios</p>
                  <p className="text-muted-foreground mb-4 text-sm">
                    La línea muestra la tendencia del total recaudado.
                  </p>
                  <RevenueChart days={revenue.days} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="mb-1 font-medium">Composición por canal</p>
                  <p className="text-muted-foreground mb-4 text-sm">
                    De qué fuente viene cada peso del período.
                  </p>
                  <PaymentMix revenue={revenue} />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground px-0.5 text-[11px] font-medium uppercase tracking-wide">
                  Detalle por día
                </p>
                <RevenueTable revenue={revenue} />
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              Sin ingresos registrados en este período.
            </div>
          )
        ) : null}
      </section>

      {/* ── 2. Ocupación ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Ocupación</h2>
            <p className="text-muted-foreground text-sm">
              Franjas más y menos ocupadas, y promedio general.
            </p>
          </div>
          <Select value={weeks} onValueChange={(v) => setWeeks(v ?? "4")}>
            <SelectTrigger className="w-40">
              <SelectValue>{(v) => `Últimas ${v} semanas`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {["2", "4", "8", "12"].map((w) => (
                <SelectItem key={w} value={w}>
                  Últimas {w} semanas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {occupancyQuery.isLoading ? (
          <SectionLoader label="Calculando ocupación…" />
        ) : occupancyQuery.data ? (
          <div className="flex flex-col gap-5">
            <OccupancyInsights report={occupancyQuery.data} />
            <Card>
              <CardContent className="p-5">
                <p className="mb-4 font-medium">Mapa de calor por día y horario</p>
                <OccupancyHeatmap report={occupancyQuery.data} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>
    </div>
  );
}
