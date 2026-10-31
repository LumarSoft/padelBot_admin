"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The board's charts: SVG drawn at the container's real width (no chart library in this
 * project, same as the rest of the console). Every chart answers the pointer — a crosshair
 * snaps to the month on time series, the mark itself is the target on bars and slices — and
 * a click on a category filters the whole board, the way a Power BI visual cross-filters.
 */

// ── Shared ───────────────────────────────────────────────────────────────────

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  dashed?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  title: string;
  rows: TooltipRow[];
}

/** One readout for every series at the hovered position. Values lead, labels follow. */
function Tooltip({ state, width }: { state: TooltipState | null; width: number }) {
  if (!state) return null;
  const flip = state.x > width * 0.6;
  return (
    <div
      role="status"
      className="bg-popover text-popover-foreground ring-foreground/10 pointer-events-none absolute z-10 min-w-40 rounded-lg px-3 py-2 text-xs shadow-lg ring-1"
      style={{
        left: flip ? undefined : state.x + 14,
        right: flip ? width - state.x + 14 : undefined,
        top: Math.max(0, state.y - 12),
      }}
    >
      <p className="text-muted-foreground mb-1 font-medium">{state.title}</p>
      <div className="space-y-0.5">
        {state.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {row.color && (
                <svg width="12" height="4" aria-hidden>
                  <line
                    x1="0"
                    y1="2"
                    x2="12"
                    y2="2"
                    stroke={row.color}
                    strokeWidth="3"
                    strokeDasharray={row.dashed ? "3 2" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {row.label}
            </span>
            <span className="font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; color: string; kind?: "rect" | "line" | "dash" | "diamond" }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <svg width="14" height="10" aria-hidden>
            {item.kind === "diamond" ? (
              <rect x="3" y="1" width="7" height="7" transform="rotate(45 6.5 4.5)" fill="var(--card)" stroke={item.color} strokeWidth="1.5" />
            ) : item.kind === "line" || item.kind === "dash" ? (
              <line
                x1="0"
                y1="5"
                x2="14"
                y2="5"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={item.kind === "dash" ? "4 3" : undefined}
              />
            ) : (
              <rect x="1" y="1" width="12" height="8" rx="2" fill={item.color} />
            )}
          </svg>
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Nice axis ticks between min and max (min may be negative). */
function ticks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const AXIS = "var(--muted-foreground)";
const GRID = "color-mix(in oklch, var(--foreground) 8%, transparent)";

// ── Time series (columns and lines share the frame) ──────────────────────────

export interface Serie {
  key: string;
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

interface FrameProps {
  labels: string[];
  height?: number;
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  /** Stacked columns (bottom to top in array order). */
  columns?: Serie[];
  /** Lines drawn over the columns. */
  lines?: Serie[];
  /** Horizontal reference that may change by position (break-even). */
  steps?: { label: string; color: string; values: number[] };
  /** Points that mark a target at given positions. */
  targets?: { label: string; color: string; points: { index: number; value: number }[] };
  /** Vertical markers (payback). */
  markers?: { index: number; label: string; color: string }[];
  /** Positions that stay at full strength; the rest fade (the period filter). */
  highlight?: (index: number) => boolean;
  onSelect?: (index: number) => void;
  ariaLabel: string;
  xLabelEvery?: number;
}

export function TimeChart({
  labels,
  height = 220,
  format,
  axisFormat = format,
  columns = [],
  lines = [],
  steps,
  targets,
  markers = [],
  highlight,
  onSelect,
  ariaLabel,
  xLabelEvery = 6,
}: FrameProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const n = labels.length;
  const stackTop = labels.map((_, i) => columns.reduce((acc, s) => acc + Math.max(0, s.values[i] ?? 0), 0));
  const all = [
    ...stackTop,
    ...lines.flatMap((s) => s.values),
    ...(steps?.values ?? []),
    ...(targets?.points.map((p) => p.value) ?? []),
    0,
  ];
  const yTicks = ticks(Math.min(...all), Math.max(...all));
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  const padL = 56;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const band = n ? plotW / n : 0;
  const x = (i: number) => padL + band * (i + 0.5);
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const barW = Math.max(2, band - Math.min(6, band * 0.3));

  function onMove(event: React.PointerEvent<SVGRectElement>) {
    const box = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = event.clientX - box.left;
    const i = Math.min(n - 1, Math.max(0, Math.floor((px - padL) / (band || 1))));
    setHover(i);
    const rows: TooltipRow[] = [
      ...[...columns].reverse().map((s) => ({ label: s.label, value: format(s.values[i] ?? 0), color: s.color })),
      ...lines.map((s) => ({ label: s.label, value: format(s.values[i] ?? 0), color: s.color, dashed: s.dashed })),
      ...(steps ? [{ label: steps.label, value: format(steps.values[i] ?? 0), color: steps.color, dashed: true }] : []),
    ];
    const target = targets?.points.find((p) => p.index === i);
    if (target && targets) rows.push({ label: targets.label, value: format(target.value), color: targets.color });
    if (columns.length > 1) rows.push({ label: "Total", value: format(stackTop[i]) });
    setTip({ x: x(i), y: event.clientY - box.top, title: labels[i], rows });
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth={v === 0 ? 1 : 1} />
              <text x={padL - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS} className="tabular-nums">
                {axisFormat(v)}
              </text>
            </g>
          ))}

          {labels.map((label, i) =>
            i % xLabelEvery === 0 || i === n - 1 ? (
              <text key={label} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill={AXIS}>
                {label}
              </text>
            ) : null,
          )}

          {/* Stacked columns: a 1px surface gap between segments keeps them apart. */}
          {labels.map((_, i) => {
            let base = 0;
            const dim = highlight && !highlight(i);
            return (
              <g key={i} opacity={dim ? 0.3 : hover === i ? 0.85 : 1}>
                {columns.map((s, k) => {
                  const v = Math.max(0, s.values[i] ?? 0);
                  if (!v) return null;
                  const top = y(base + v);
                  const bottom = y(base);
                  base += v;
                  const isTop = k === columns.length - 1 || columns.slice(k + 1).every((o) => !(o.values[i] > 0));
                  const h = Math.max(0, bottom - top - (isTop ? 0 : 1));
                  return (
                    <rect
                      key={s.key}
                      x={x(i) - barW / 2}
                      y={top}
                      width={barW}
                      height={h}
                      rx={isTop ? Math.min(3, barW / 2) : 0}
                      fill={s.color}
                    />
                  );
                })}
              </g>
            );
          })}

          {steps && (
            <path
              d={steps.values
                .map((v, i) => `${i === 0 ? "M" : "L"}${x(i) - band / 2},${y(v)} L${x(i) + band / 2},${y(v)}`)
                .join(" ")}
              fill="none"
              stroke={steps.color}
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
          )}

          {lines.map((s) => (
            <path
              key={s.key}
              d={s.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.dashed ? "6 4" : undefined}
              strokeLinejoin="round"
            />
          ))}

          {targets?.points.map((p) => (
            <g key={p.index}>
              <rect
                x={x(p.index) - 6}
                y={y(p.value) - 6}
                width="12"
                height="12"
                transform={`rotate(45 ${x(p.index)} ${y(p.value)})`}
                fill="var(--card)"
                stroke={targets.color}
                strokeWidth="2"
              />
              <text x={x(p.index) - 10} y={y(p.value) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={targets.color}>
                {format(p.value)}
              </text>
            </g>
          ))}

          {markers.map((m) => (
            <g key={m.label}>
              <line x1={x(m.index)} x2={x(m.index)} y1={padT} y2={padT + plotH} stroke={m.color} strokeDasharray="2 3" />
              <text
                x={x(m.index) + 4}
                y={padT + 10}
                fontSize="11"
                fontWeight="600"
                fill={m.color}
                stroke="var(--card)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {m.label}
              </text>
            </g>
          ))}

          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={AXIS} strokeOpacity="0.5" />
          )}
          {hover != null &&
            lines.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r="4" fill="var(--card)" stroke={s.color} strokeWidth="2" />
            ))}

          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="transparent"
            className={onSelect ? "cursor-pointer" : undefined}
            onPointerMove={onMove}
            onPointerLeave={() => {
              setHover(null);
              setTip(null);
            }}
            onClick={() => hover != null && onSelect?.(hover)}
          />
        </svg>
      )}
      <Tooltip state={tip} width={width} />
    </div>
  );
}

// ── Horizontal bars ──────────────────────────────────────────────────────────

export interface BarItem {
  key: string;
  label: string;
  value: number;
  /** Optional segments (same order everywhere) instead of one value. */
  segments?: { key: string; label: string; value: number; color: string }[];
  /** A goal to read the bar against (a tick across the bar). */
  target?: number;
  detail?: string;
}

export function HBars({
  items,
  format,
  color = "var(--brand)",
  selected,
  onSelect,
  ariaLabel,
  targetLabel = "Meta",
}: {
  items: BarItem[];
  format: (v: number) => string;
  color?: string;
  selected?: string | null;
  onSelect?: (key: string) => void;
  ariaLabel: string;
  targetLabel?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const rowH = 30;
  const labelW = Math.min(170, Math.max(90, width * 0.32));
  const valueW = 70;
  const max = Math.max(1e-9, ...items.map((i) => Math.max(i.value, i.target ?? 0)));
  const min = Math.min(0, ...items.map((i) => i.value));
  const plotW = Math.max(0, width - labelW - valueW);
  const xs = (v: number) => labelW + ((v - min) / (max - min || 1)) * plotW;
  const height = items.length * rowH + 4;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {min < 0 && <line x1={xs(0)} x2={xs(0)} y1={0} y2={height} stroke={AXIS} />}
          {items.map((item, r) => {
            const yTop = r * rowH + 6;
            const dim = selected != null && selected !== item.key;
            let acc = 0;
            return (
              <g
                key={item.key}
                opacity={dim ? 0.35 : 1}
                className={onSelect ? "cursor-pointer" : undefined}
                onClick={() => onSelect?.(item.key)}
                onPointerMove={(event) => {
                  const box = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: event.clientX - box.left,
                    y: event.clientY - box.top,
                    title: item.label,
                    rows: [
                      ...(item.segments ?? []).map((s) => ({ label: s.label, value: format(s.value), color: s.color })),
                      { label: item.segments ? "Total" : "Valor", value: format(item.value) },
                      ...(item.target != null ? [{ label: targetLabel, value: format(item.target) }] : []),
                      ...(item.detail ? [{ label: "Detalle", value: item.detail }] : []),
                    ],
                  });
                }}
                onPointerLeave={() => setTip(null)}
              >
                <rect x={0} y={yTop - 6} width={width} height={rowH} fill="transparent" />
                <text x={labelW - 8} y={yTop + 9} textAnchor="end" fontSize="12" fill="var(--foreground)">
                  {wrapLabel(item.label, labelW - 12).map((line, k, all) => (
                    <tspan key={k} x={labelW - 8} dy={k === 0 ? (all.length > 1 ? "-0.45em" : "0") : "1.1em"}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {item.segments ? (
                  item.segments.map((s, k) => {
                    const x0 = xs(acc);
                    acc += s.value;
                    const w = Math.max(0, xs(acc) - x0 - (k < item.segments!.length - 1 ? 1 : 0));
                    return <rect key={s.key} x={x0} y={yTop} width={w} height={18} fill={s.color} rx={k === item.segments!.length - 1 ? 3 : 0} />;
                  })
                ) : (
                  <rect
                    x={Math.min(xs(0), xs(item.value))}
                    y={yTop}
                    width={Math.abs(xs(item.value) - xs(0))}
                    height={18}
                    rx="3"
                    fill={item.value < 0 ? "var(--viz-2)" : color}
                  />
                )}
                {item.target != null && (
                  <line x1={xs(item.target)} x2={xs(item.target)} y1={yTop - 3} y2={yTop + 21} stroke="var(--foreground)" strokeWidth="2" />
                )}
                <text
                  x={Math.max(xs(Math.max(0, item.value)), item.target != null ? xs(item.target) : 0) + 6}
                  y={yTop + 13}
                  fontSize="12"
                  fontWeight="600"
                  fill="var(--foreground)"
                  className="tabular-nums"
                >
                  {format(item.value)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip state={tip} width={width} />
    </div>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────

export function Donut({
  slices,
  format,
  center,
  selected,
  onSelect,
  ariaLabel,
}: {
  slices: { key: string; label: string; value: number; color: string }[];
  format: (v: number) => string;
  center: ReactNode;
  selected?: string | null;
  onSelect?: (key: string) => void;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const size = 180;
  const r = 70;
  const stroke = 26;
  const c = 2 * Math.PI * r;
  const offsets = cumulativeStarts(slices.map((s) => (s.value / total) * c));
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {slices.map((s, i) => {
              const len = (s.value / total) * c;
              const offset = offsets[i];
              const gap = slices.filter((x) => x.value > 0).length > 1 ? 2 : 0;
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.key ? stroke + 4 : stroke}
                  strokeDasharray={`${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`}
                  strokeDashoffset={-offset}
                  opacity={selected && selected !== s.key ? 0.3 : 1}
                  className={onSelect ? "cursor-pointer" : undefined}
                  onPointerEnter={() => setHover(s.key)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => onSelect?.(s.key)}
                />
              );
              return el;
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => onSelect?.(s.key)}
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover(null)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md px-1.5 py-1 text-left transition-colors",
                "hover:bg-foreground/5",
                selected === s.key && "bg-foreground/10",
                selected && selected !== s.key && "opacity-50",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums">
                <span className="font-semibold">{format(s.value)}</span>{" "}
                <span className="text-muted-foreground text-xs">{Math.round((s.value / total) * 100)}%</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Waterfall ────────────────────────────────────────────────────────────────

export function Waterfall({
  steps,
  format,
  axisFormat = format,
  ariaLabel,
  height = 240,
}: {
  steps: WaterfallStep[];
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const bars = waterfallLevels(steps);
  const yTicks = ticks(Math.min(0, ...bars.flatMap((b) => [b.from, b.to])), Math.max(0, ...bars.flatMap((b) => [b.from, b.to])));
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const padL = 64;
  const padB = 46;
  const padT = 16;
  const plotW = Math.max(0, width - padL - 8);
  const plotH = height - padT - padB;
  const band = steps.length ? plotW / steps.length : 0;
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const color = (k: string) =>
    k === "out" ? "var(--viz-2)" : k === "in" || k === "start" ? "var(--viz-1)" : "var(--foreground)";

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={padL} x2={width - 8} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} />
              <text x={padL - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS}>
                {axisFormat(v)}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const x0 = padL + band * i + band * 0.15;
            const w = band * 0.7;
            const top = y(Math.max(b.from, b.to));
            const h = Math.max(1, Math.abs(y(b.from) - y(b.to)));
            const next = bars[i + 1];
            return (
              <g
                key={b.key}
                onPointerMove={(event) => {
                  const box = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: event.clientX - box.left,
                    y: event.clientY - box.top,
                    title: b.label,
                    rows: [
                      { label: b.kind === "out" ? "Salida" : b.kind === "total" ? "Resultado" : "Entrada", value: format(b.kind === "out" ? -b.value : b.value) },
                      { label: "Saldo después", value: format(b.to) },
                    ],
                  });
                }}
                onPointerLeave={() => setTip(null)}
              >
                <rect x={padL + band * i} y={padT} width={band} height={plotH} fill="transparent" />
                <rect x={x0} y={top} width={w} height={h} rx="3" fill={color(b.kind)} opacity={b.kind === "total" ? 0.85 : 1} />
                {next && next.kind !== "total" && next.kind !== "start" && (
                  <line x1={x0 + w} x2={x0 + band} y1={y(b.to)} y2={y(b.to)} stroke={AXIS} strokeDasharray="2 2" />
                )}
                {wrapLabel(b.short ?? b.label, band - 2, 5.4).slice(0, 2).map((line, k) => (
                  <text key={k} x={x0 + w / 2} y={height - padB + 14 + k * 13} textAnchor="middle" fontSize="10.5" fill={AXIS}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip state={tip} width={width} />
    </div>
  );
}

/**
 * Splits an axis label into lines that fit a width (about 6.2 px per character at 11–12 px),
 * breaking only between words; SVG text does not wrap by itself.
 */
function wrapLabel(label: string, maxWidth: number, charWidth = 6.2): string[] {
  const perLine = Math.max(4, Math.floor(maxWidth / charWidth));
  if (label.length <= perLine) return [label];
  const lines: string[] = [];
  let current = "";
  for (const word of label.split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > perLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Start of each slice along the ring: the running sum of the lengths before it. */
function cumulativeStarts(lengths: number[]): number[] {
  const out: number[] = [];
  let running = 0;
  for (const len of lengths) {
    out.push(running);
    running += len;
  }
  return out;
}

type WaterfallStep = {
  key: string;
  label: string;
  /** Axis label when the full one does not fit under a column; the tooltip keeps the full one. */
  short?: string;
  value: number;
  kind: "start" | "in" | "out" | "total";
};

/** Level before and after each step of a cascade; totals and the start sit on zero. */
function waterfallLevels(steps: WaterfallStep[]) {
  const out: (WaterfallStep & { from: number; to: number })[] = [];
  let level = 0;
  for (const s of steps) {
    const from = s.kind === "total" || s.kind === "start" ? 0 : level;
    const to = s.kind === "total" || s.kind === "start" ? s.value : level + (s.kind === "in" ? s.value : -s.value);
    level = to;
    out.push({ ...s, from, to });
  }
  return out;
}
