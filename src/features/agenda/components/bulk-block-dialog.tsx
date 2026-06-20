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
import { SCHEDULE, todayKey } from "@/features/agenda/lib/schedule";

export function BulkBlockDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [allDay, setAllDay] = useState(true);
  const [fromBand, setFromBand] = useState(SCHEDULE[0].start);
  const [toBand, setToBand] = useState(SCHEDULE[SCHEDULE.length - 1].start);

  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];
  const bulkBlock = useBulkBlockSlots();

  const slotStarts = useMemo(() => {
    if (allDay) return undefined;
    const a = SCHEDULE.findIndex((b) => b.start === fromBand);
    const b = SCHEDULE.findIndex((b) => b.start === toBand);
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    return SCHEDULE.slice(lo, hi + 1).map((band) => band.start);
  }, [allDay, fromBand, toBand]);

  function reset() {
    setSelected(new Set());
    setFromDate(todayKey());
    setToDate(todayKey());
    setAllDay(true);
    setFromBand(SCHEDULE[0].start);
    setToBand(SCHEDULE[SCHEDULE.length - 1].start);
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

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Desde las</Label>
                <Select value={fromBand} onValueChange={(v) => setFromBand(v ?? SCHEDULE[0].start)}>
                  <SelectTrigger>
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE.map((b) => (
                      <SelectItem key={b.start} value={b.start}>
                        {b.start}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Hasta las</Label>
                <Select value={toBand} onValueChange={(v) => setToBand(v ?? SCHEDULE[0].start)}>
                  <SelectTrigger>
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE.map((b) => (
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
