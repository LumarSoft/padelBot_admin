"use client";

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
import { formatPrice, formatTimeRange } from "@/lib/format";
import type { Slot } from "@/types/api/turnos";

interface SlotPickerProps {
  date: string;
  courtId: string;
  slotId: string;
  onDateChange: (date: string) => void;
  onCourtChange: (courtId: string) => void;
  onSlotChange: (slotId: string) => void;
  excludeSlotId?: string;
}

function localDayBounds(dateStr: string): { from: string; to: string } {
  const from = new Date(`${dateStr}T00:00`);
  const to = new Date(`${dateStr}T23:59`);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function SlotPicker({
  date,
  courtId,
  slotId,
  onDateChange,
  onCourtChange,
  onSlotChange,
  excludeSlotId,
}: SlotPickerProps) {
  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];

  const bounds = date ? localDayBounds(date) : undefined;
  const slotsQuery = useSlots(
    bounds
      ? {
          status: "AVAILABLE",
          courtId: courtId || undefined,
          from: bounds.from,
          to: bounds.to,
        }
      : {},
  );
  const availableSlots: Slot[] = (slotsQuery.data ?? []).filter(
    (s) => s.id !== excludeSlotId,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sp-date">Fecha</Label>
          <Input
            id="sp-date"
            type="date"
            value={date}
            onChange={(e) => {
              onDateChange(e.target.value);
              onSlotChange("");
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cancha</Label>
          <Select
            value={courtId}
            onValueChange={(v) => {
              onCourtChange(v ?? "");
              onSlotChange("");
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
        ) : slotsQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Buscando turnos…
          </div>
        ) : availableSlots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay turnos disponibles para esa fecha.
          </p>
        ) : (
          <Select value={slotId} onValueChange={(v) => onSlotChange(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un turno">
                {(v) => {
                  const s = availableSlots.find((slot) => slot.id === v);
                  return s
                    ? `${s.court.name} · ${formatTimeRange(s.startsAt, s.endsAt)} · ${formatPrice(s.priceCents)}`
                    : "";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableSlots.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="font-medium">{s.court.name}</span>
                  <span className="text-muted-foreground ml-1.5">
                    {formatTimeRange(s.startsAt, s.endsAt)} ·{" "}
                    {formatPrice(s.priceCents)}
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
