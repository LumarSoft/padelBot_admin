"use client";

import { useMemo } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useAgendaDay } from "@/features/agenda/hooks/use-agenda-day";
import { AgendaCell } from "@/features/agenda/components/agenda-cell";
import {
  bandsForDate,
  bandSortMinutes,
  buildSlotDateTimes,
  resolveBandPriceCents,
  todayKey,
  type ScheduleBand,
} from "@/features/agenda/lib/schedule";
import type { Court } from "@/types/api/turnos";

interface AgendaGridProps {
  dayKey: string;
  courtId: string;
}

/** Union of all courts' bands for the day, in chronological order (past-midnight last). */
function buildUnionSchedule(courts: Court[], dayKey: string): ScheduleBand[] {
  const seen = new Set<string>();
  const all: ScheduleBand[] = [];
  for (const court of courts) {
    for (const band of bandsForDate(court, dayKey)) {
      if (!seen.has(band.start)) {
        seen.add(band.start);
        all.push(band);
      }
    }
  }
  return all.sort((a, b) => bandSortMinutes(a) - bandSortMinutes(b));
}

export function AgendaGrid({ dayKey, courtId }: AgendaGridProps) {
  const courtsQuery = useCourts();
  const allCourts = courtsQuery.data ?? [];
  const courts = courtId ? allCourts.filter((c) => c.id === courtId) : allCourts;

  const schedule = useMemo(() => buildUnionSchedule(courts, dayKey), [courts, dayKey]);

  const courtValidBands = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const court of courts) {
      map.set(court.id, new Set(bandsForDate(court, dayKey).map((b) => b.start)));
    }
    return map;
  }, [courts, dayKey]);

  const { cellFor, isLoading } = useAgendaDay(dayKey, courtId, courts);

  const isToday = dayKey === todayKey();
  const nowUtc = new Date();

  if (courtsQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando agenda…
      </div>
    );
  }

  if (allCourts.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No hay canchas"
        description="Creá una cancha en Configuración para empezar a usar la agenda."
      />
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border">
      {isLoading && (
        <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-xs">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}
      <div
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `5rem repeat(${courts.length}, minmax(8.5rem, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="bg-muted/50 sticky left-0 z-[1] border-b border-r px-2 py-2.5" />
        {courts.map((court) => (
          <div
            key={court.id}
            className="bg-muted/50 border-b px-2 py-2.5 text-center text-sm font-medium"
          >
            {court.name}
          </div>
        ))}

        {/* Time rows */}
        {schedule.map((band) => {
          const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
          const isCurrent =
            isToday && nowUtc >= new Date(startsAt) && nowUtc < new Date(endsAt);
          return (
          <div key={band.start} className="contents">
            <div
              className={cn(
                "bg-muted/30 text-muted-foreground sticky left-0 z-[1] flex items-center justify-end border-r px-2 py-1.5 text-xs tabular-nums",
                isCurrent && "bg-brand/5 text-brand font-semibold",
              )}
            >
              {band.start}
            </div>
            {courts.map((court) => {
              const inSchedule = courtValidBands.get(court.id)?.has(band.start) ?? false;
              return (
                <div key={court.id} className="p-1">
                  {inSchedule ? (
                    <AgendaCell
                      courtId={court.id}
                      courtName={court.name}
                      // The band's price, not the court's default: a band with a price
                      // exception must quote the exception even before its slot exists.
                      courtPriceCents={resolveBandPriceCents(court, dayKey, band.start)}
                      dayKey={dayKey}
                      band={band}
                      data={cellFor(court.id, band.start)}
                    />
                  ) : (
                    <div className="h-14 w-full rounded-lg border border-dashed border-border/25 bg-muted/20 cursor-not-allowed" />
                  )}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}
