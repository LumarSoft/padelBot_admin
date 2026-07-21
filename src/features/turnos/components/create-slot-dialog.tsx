"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
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
import { useCreateSlot } from "@/features/turnos/hooks/use-slots";
import { todayKey, wallTimeToUtc } from "@/features/agenda/lib/schedule";
import type { Court } from "@/types/api/turnos";

export function CreateSlotDialog({ courts }: { courts: Court[] }) {
  const [open, setOpen] = useState(false);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [date, setDate] = useState(todayKey);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:30");
  const [price, setPrice] = useState(() =>
    String((courts[0]?.priceCents ?? 0) / 100),
  );
  const [error, setError] = useState<string | null>(null);
  const createSlot = useCreateSlot();

  function handleCourtChange(value: string | null): void {
    const next = value ?? "";
    setCourtId(next);
    const court = courts.find((c) => c.id === next);
    if (court) setPrice(String(court.priceCents / 100));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    const selectedCourt = courtId || courts[0]?.id;
    if (!selectedCourt) {
      setError("Elegí una cancha.");
      return;
    }

    // Build the instants in the club timezone (not the browser's) so they line up
    // with the bot's availability grid — otherwise the bot can't see the slot.
    const startsAt = wallTimeToUtc(date, start);
    const endsAt = end === "00:00" ? wallTimeToUtc(date, "24:00") : wallTimeToUtc(date, end);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Revisá la fecha y los horarios.");
      return;
    }
    if (endsAt <= startsAt) {
      setError("El horario de fin debe ser posterior al de inicio.");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Ingresá un precio válido.");
      return;
    }

    createSlot.mutate(
      {
        courtId: selectedCourt,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        priceCents: Math.round(priceNumber * 100),
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nuevo turno
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Creá un turno disponible para reservar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Cancha</Label>
            <Select value={courtId} onValueChange={handleCourtChange}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí una cancha">
                  {(value) =>
                    courts.find((court) => court.id === value)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slot-date">Fecha</Label>
            <Input
              id="slot-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-start">Inicio</Label>
              <Input
                id="slot-start"
                type="time"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-end">Fin</Label>
              <Input
                id="slot-end"
                type="time"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slot-price">Precio (ARS)</Label>
            <Input
              id="slot-price"
              type="number"
              min={0}
              step={500}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={createSlot.isPending}>
              {createSlot.isPending ? "Creando…" : "Crear turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
