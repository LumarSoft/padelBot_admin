"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useBulkBlockSlots } from "@/features/turnos/hooks/use-slots";
import {
  allBandsForCourt,
  bandSortMinutes,
  todayKey,
  type ScheduleBand,
} from "@/features/agenda/lib/schedule";
import type { Court } from "@/types/api/turnos";

/** Union of all courts' schedule bands (any weekday), in chronological order. */
function buildUnionSchedule(courts: Court[]): ScheduleBand[] {
  const seen = new Set<string>();
  const all: ScheduleBand[] = [];
  for (const court of courts) {
    for (const band of allBandsForCourt(court)) {
      if (!seen.has(band.start)) {
        seen.add(band.start);
        all.push(band);
      }
    }
  }
  return all.sort((a, b) => bandSortMinutes(a) - bandSortMinutes(b));
}

export function BulkBlockDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [allDay, setAllDay] = useState(true);
  const [fromBand, setFromBand] = useState("09:00");
  const [toBand, setToBand] = useState("22:30");

  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];
  const bulkBlock = useBulkBlockSlots();

  const schedule = useMemo(() => buildUnionSchedule(courts), [courts]);

  const slotStarts = useMemo(() => {
    if (allDay) return undefined;
    const a = schedule.findIndex((b) => b.start === fromBand);
    const b = schedule.findIndex((b) => b.start === toBand);
    if (a === -1 || b === -1) return undefined;
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    return schedule.slice(lo, hi + 1).map((band) => band.start);
  }, [allDay, fromBand, toBand, schedule]);

  function reset() {
    setSelected(new Set());
    setFromDate(todayKey());
    setToDate(todayKey());
    setAllDay(true);
    setFromBand(schedule[0]?.start ?? "09:00");
    setToBand(schedule[schedule.length - 1]?.start ?? "22:30");
  }

  function toggleCourt(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = courts.length > 0 && selected.size === courts.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(courts.map((c) => c.id)));
  }

  const datesValid = !!fromDate && !!toDate && fromDate <= toDate;
  const canSubmit = selected.size > 0 && datesValid && !bulkBlock.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    bulkBlock.mutate(
      { courtIds: [...selected], fromDate, toDate, slotStarts },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Lock className="size-4" />
        Bloquear varios
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bloquear varios turnos</DialogTitle>
          <DialogDescription>
            Ideal para torneos o cierres: bloquea las canchas y días elegidos. Los turnos
            ya reservados se respetan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Canchas</Label>
              {courts.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-brand text-xs font-medium hover:underline"
                >
                  {allSelected ? "Quitar todas" : "Seleccionar todas"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {courts.map((court) => {
                const active = selected.has(court.id);
                return (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => toggleCourt(court.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {court.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bb-from">Desde</Label>
              <Input
                id="bb-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bb-to">Hasta</Label>
              <Input
                id="bb-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Bloquear todo el día
          </label>

          {!allDay && schedule.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Desde las</Label>
                <Select
                  value={fromBand}
                  onValueChange={(v) => setFromBand(v ?? schedule[0].start)}
                >
                  <SelectTrigger>
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {schedule.map((b) => (
                      <SelectItem key={b.start} value={b.start}>
                        {b.start}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Hasta las</Label>
                <Select
                  value={toBand}
                  onValueChange={(v) => setToBand(v ?? schedule[0].start)}
                >
                  <SelectTrigger>
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {schedule.map((b) => (
                      <SelectItem key={b.start} value={b.start}>
                        {b.start}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!datesValid && (fromDate || toDate) && (
            <p className="text-destructive text-xs">
              La fecha &quot;hasta&quot; debe ser igual o posterior a &quot;desde&quot;.
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {bulkBlock.isPending ? "Bloqueando…" : "Bloquear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
