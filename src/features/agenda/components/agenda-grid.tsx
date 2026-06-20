"use client";

import { LayoutGrid, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useAgendaDay } from "@/features/agenda/hooks/use-agenda-day";
import { AgendaCell } from "@/features/agenda/components/agenda-cell";
import { SCHEDULE } from "@/features/agenda/lib/schedule";

interface AgendaGridProps {
  dayKey: string;
  courtId: string;
}

export function AgendaGrid({ dayKey, courtId }: AgendaGridProps) {
  const courtsQuery = useCourts();
  const allCourts = courtsQuery.data ?? [];
  const courts = courtId ? allCourts.filter((c) => c.id === courtId) : allCourts;

  const { cellFor, isLoading } = useAgendaDay(dayKey, courtId);

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
        {SCHEDULE.map((band) => (
          <div key={band.start} className="contents">
            <div className="bg-muted/30 text-muted-foreground sticky left-0 z-[1] flex items-center justify-end border-r px-2 py-1.5 text-xs tabular-nums">
              {band.start}
            </div>
            {courts.map((court) => (
              <div key={court.id} className="p-1">
                <AgendaCell
                  courtId={court.id}
                  courtName={court.name}
                  courtPriceCents={court.priceCents}
                  dayKey={dayKey}
                  band={band}
                  data={cellFor(court.id, band.start)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
