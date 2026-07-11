"use client";

import { cn } from "@/lib/utils";

export interface BarSeriesPoint {
  date: string;
  /** The series that carries the story — painted in the brand hue. */
  primary: number;
  /** Context. Deliberately gray: it's the baseline the primary is read against. */
  secondary?: number;
}

interface BarSeriesProps {
  points: BarSeriesPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  /** Formats the hover tooltip's value (defaults to the raw number). */
  format?: (value: number) => string;
}

/**
 * A small stacked-column chart, CSS only — no chart library in this project.
 *
 * It's an EMPHASIS chart, not a categorical one: the primary series is the point and the
 * secondary is context, so one hue plus the de-emphasis gray rather than two competing
 * colors. Both series are named in the legend, so identity never rests on color alone.
 */
export function BarSeries({
  points,
  primaryLabel,
  secondaryLabel,
  format = (value) => String(value),
}: BarSeriesProps) {
  const max = Math.max(
    1,
    ...points.map((p) => p.primary + (p.secondary ?? 0)),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <LegendSwatch className="bg-brand" label={primaryLabel} />
        {secondaryLabel && (
          <LegendSwatch className="bg-muted-foreground" label={secondaryLabel} />
        )}
      </div>

      <div
        className="flex h-32 items-end gap-px"
        role="img"
        aria-label={`${primaryLabel}${secondaryLabel ? ` y ${secondaryLabel}` : ""} por día`}
      >
        {points.map((point) => {
          const total = point.primary + (point.secondary ?? 0);
          const tooltip = [
            point.date,
            `${primaryLabel}: ${format(point.primary)}`,
            secondaryLabel && `${secondaryLabel}: ${format(point.secondary ?? 0)}`,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div
              key={point.date}
              title={tooltip}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              {/* 2px surface gap between the two fills, per the mark spec. */}
              {point.secondary != null && point.secondary > 0 && (
                <div
                  className="bg-muted-foreground mb-px rounded-t-[4px] opacity-70 transition-opacity group-hover:opacity-100"
                  style={{ height: `${(point.secondary / max) * 100}%` }}
                />
              )}
              <div
                className="bg-brand rounded-t-[4px] transition-opacity group-hover:opacity-80"
                style={{ height: `${(point.primary / max) * 100}%` }}
              />
              {/* Keeps an empty day from collapsing to nothing, so gaps read as gaps. */}
              {total === 0 && <div className="bg-foreground/10 h-px" />}
            </div>
          );
        })}
      </div>

      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
