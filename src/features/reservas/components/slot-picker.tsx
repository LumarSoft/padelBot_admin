"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useSlots } from "@/features/turnos/hooks/use-slots";
import { dayRangeForCourts, todayKey } from "@/features/agenda/lib/schedule";
import { freeSlotOptions, type SlotOption } from "@/features/reservas/lib/slot-options";
import { formatPrice, formatTimeRange } from "@/lib/format";

interface SlotPickerProps {
  /** Club-local "YYYY-MM-DD". */
  date: string;
  courtId: string;
  value: SlotOption | null;
  onDateChange: (date: string) => void;
  onCourtChange: (courtId: string) => void;
  onChange: (option: SlotOption | null) => void;
  excludeSlotId?: string;
}

/**
 * Day + court + turno picker over the same free bands the Agenda shows, including bands whose
 * Slot was never created. Resolve the picked option with `useEnsureSlot` before using its id.
 */
export function SlotPicker({
  date,
  courtId,
  value,
  onDateChange,
  onCourtChange,
  onChange,
  excludeSlotId,
}: SlotPickerProps) {
  const courtsQuery = useCourts();
  const courts = useMemo(() => courtsQuery.data ?? [], [courtsQuery.data]);

  // Every status and every court: a BOOKED/BLOCKED slot is what hides a band, and one query per
  // day serves any court filter. The range runs past midnight for late-closing schedules.
  const range = date && courts.length ? dayRangeForCourts(date, courts) : null;
  const slotsQuery = useSlots(range ?? {}, { enabled: !!range });

  const options = useMemo(() => {
    if (!date || !slotsQuery.data) return [];
    const scoped = courtId ? courts.filter((c) => c.id === courtId) : courts;
    return freeSlotOptions(scoped, slotsQuery.data, date).filter((o) => !o.slotId || o.slotId !== excludeSlotId);
  }, [courts, courtId, date, slotsQuery.data, excludeSlotId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sp-date">Fecha</Label>
          <Input
            id="sp-date"
            type="date"
            value={date}
            min={todayKey()}
            onChange={(e) => {
              onDateChange(e.target.value);
              onChange(null);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cancha</Label>
          <Select
            value={courtId}
            onValueChange={(v) => {
              onCourtChange(v ?? "");
              onChange(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas">
                {(v) =>
                  !v || v === ""
                    ? "Todas"
                    : (courts.find((c) => c.id === v)?.name ?? "")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {courts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Turno disponible</Label>
        {!date ? (
          <p className="text-muted-foreground text-sm">
            Elegí una fecha para ver los turnos disponibles.
          </p>
        ) : courtsQuery.isLoading || slotsQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Buscando turnos…
          </div>
        ) : options.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay turnos disponibles para esa fecha.
          </p>
        ) : (
          <Select
            value={value?.key ?? ""}
            onValueChange={(v) => onChange(options.find((o) => o.key === v) ?? null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un turno">
                {(v) => {
                  const o = options.find((option) => option.key === v);
                  return o
                    ? `${o.courtName} · ${formatTimeRange(o.startsAt, o.endsAt)} · ${formatPrice(o.priceCents)}`
                    : `Elegí un turno (${options.length} libres)`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  <span className="font-medium">{o.courtName}</span>
                  <span className="text-muted-foreground ml-1.5">
                    {formatTimeRange(o.startsAt, o.endsAt)} ·{" "}
                    {formatPrice(o.priceCents)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
