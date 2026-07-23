"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Loader2, Lock, LockOpen, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import { slotsService } from "@/services/slots.service";
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
  /** When true, every cell is a checkbox and the block/unblock bar is shown. */
  selectionMode?: boolean;
  onExitSelection?: () => void;
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

export function AgendaGrid({
  dayKey,
  courtId,
  selectionMode = false,
  onExitSelection,
}: AgendaGridProps) {
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

  // Selection keyed by `${courtId}|${bandStart}` — all on the currently viewed day.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Reset the selection whenever the day, the court filter, or the mode changes: a kept
  // key would point at a cell that's no longer on screen. Done during render (not an
  // effect) per React's "adjust state when a prop changes" pattern.
  const selectionScope = `${dayKey}|${courtId}|${selectionMode}`;
  const [prevScope, setPrevScope] = useState(selectionScope);
  if (prevScope !== selectionScope) {
    setPrevScope(selectionScope);
    setSelected(new Set());
  }

  const queryClient = useQueryClient();

  function toggleCell(court: string, start: string) {
    const key = `${court}|${start}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Split the current selection into what can be blocked (not already blocked) and what
  // can be freed (currently blocked), grouped per court for the bulk API.
  const { toBlock, toUnblock } = useMemo(() => {
    const block = new Map<string, string[]>();
    const unblock = new Map<string, string[]>();
    for (const key of selected) {
      const [court, start] = key.split("|");
      const data = cellFor(court, start);
      const target = data.slot?.status === "BLOCKED" ? unblock : block;
      const arr = target.get(court) ?? [];
      arr.push(start);
      target.set(court, arr);
    }
    const count = (m: Map<string, string[]>) =>
      [...m.values()].reduce((n, a) => n + a.length, 0);
    return {
      toBlock: { byCourt: block, count: count(block) },
      toUnblock: { byCourt: unblock, count: count(unblock) },
    };
  }, [selected, cellFor]);

  const mutation = useMutation<
    { action: "block" | "unblock"; affected: number },
    ApiError,
    { action: "block" | "unblock"; byCourt: Map<string, string[]> }
  >({
    mutationFn: async ({ action, byCourt }) => {
      let affected = 0;
      for (const [court, starts] of byCourt) {
        if (starts.length === 0) continue;
        const body = { courtIds: [court], fromDate: dayKey, toDate: dayKey, slotStarts: starts };
        if (action === "block") affected += (await slotsService.bulkBlock(body)).blocked;
        else affected += (await slotsService.bulkUnblock(body)).unblocked;
      }
      return { action, affected };
    },
    onSuccess: ({ action, affected }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      const noun = `turno${affected === 1 ? "" : "s"}`;
      toast.success(
        action === "block"
          ? `${affected} ${noun} bloqueado${affected === 1 ? "" : "s"}`
          : `${affected} ${noun} desbloqueado${affected === 1 ? "" : "s"}`,
      );
      setSelected(new Set());
      onExitSelection?.();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "No se pudo completar"),
  });

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
    <>
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
                          courtPriceCents={resolveBandPriceCents(court, dayKey, band.start)}
                          dayKey={dayKey}
                          band={band}
                          data={cellFor(court.id, band.start)}
                          selectionMode={selectionMode}
                          selected={selected.has(`${court.id}|${band.start}`)}
                          onToggleSelect={() => toggleCell(court.id, band.start)}
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

      {/* Clearance so the floating bar never sits on top of the last row: the extra
          scroll height lets that row scroll above the bar. */}
      {selectionMode && <div aria-hidden className="h-24" />}

      {/* Floating action bar — appears in selection mode. */}
      {selectionMode && (
        <div className="animate-fade-up fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="bg-popover/95 flex items-center gap-3 rounded-2xl border p-2 pl-4 shadow-lg backdrop-blur-md">
            <span className="text-sm">
              <span className="font-semibold tabular-nums">{selected.size}</span>{" "}
              <span className="text-muted-foreground">
                turno{selected.size === 1 ? "" : "s"} seleccionado{selected.size === 1 ? "" : "s"}
              </span>
            </span>
            <div className="bg-border h-6 w-px" />
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={toBlock.count === 0 || mutation.isPending}
              onClick={() => mutation.mutate({ action: "block", byCourt: toBlock.byCourt })}
            >
              {mutation.isPending && mutation.variables?.action === "block" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              Bloquear{toBlock.count > 0 ? ` (${toBlock.count})` : ""}
            </Button>
            {toUnblock.count > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: "unblock", byCourt: toUnblock.byCourt })}
              >
                {mutation.isPending && mutation.variables?.action === "unblock" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LockOpen className="size-4" />
                )}
                Desbloquear ({toUnblock.count})
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => onExitSelection?.()}
            >
              <X className="size-4" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
