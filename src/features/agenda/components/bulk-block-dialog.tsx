"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Lock, LockOpen } from "lucide-react";
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
import {
  useBulkBlockSlots,
  useBulkUnblockSlots,
} from "@/features/turnos/hooks/use-slots";
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

type Mode = "block" | "unblock";

export function BulkBlockDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("block");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [allDay, setAllDay] = useState(true);
  const [fromBand, setFromBand] = useState("09:00");
  const [toBand, setToBand] = useState("22:30");

  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];
  const bulkBlock = useBulkBlockSlots();
  const bulkUnblock = useBulkUnblockSlots();

  const unblocking = mode === "unblock";
  const busy = bulkBlock.isPending || bulkUnblock.isPending;

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
    setMode("block");
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
  const canSubmit = selected.size > 0 && datesValid && !busy;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const body = { courtIds: [...selected], fromDate, toDate, slotStarts };
    const done = {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    };
    if (unblocking) bulkUnblock.mutate(body, done);
    else bulkBlock.mutate(body, done);
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
        Bloqueos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {unblocking ? "Desbloquear varios turnos" : "Bloquear varios turnos"}
          </DialogTitle>
          <DialogDescription>
            {unblocking
              ? "Libera de una todos los turnos bloqueados en las canchas y días elegidos. Las reservas no se tocan."
              : "Ideal para torneos o cierres: bloquea las canchas y días elegidos. Los turnos ya reservados se respetan."}
          </DialogDescription>
        </DialogHeader>

        {/* Un bloqueo masivo se deshace igual de rápido que se hizo. */}
        <div className="bg-muted/50 flex rounded-lg border p-0.5">
          {(
            [
              { value: "block", label: "Bloquear", icon: Lock },
              { value: "unblock", label: "Desbloquear", icon: LockOpen },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              disabled={busy}
              aria-pressed={mode === value}
              className={cn(
                "ease-fluid flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
                mode === value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

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
            {unblocking ? "Todo el día" : "Bloquear todo el día"}
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
            <Button type="submit" variant={unblocking ? "brand" : "default"} disabled={!canSubmit}>
              {busy && <Loader2 className="animate-spin" />}
              {busy
                ? unblocking
                  ? "Desbloqueando…"
                  : "Bloqueando…"
                : unblocking
                  ? "Desbloquear turnos"
                  : "Bloquear turnos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
