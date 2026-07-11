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
import { useCreateCourt } from "@/features/turnos/hooks/use-courts";

const DURATION_OPTIONS = [60, 90, 120] as const;

function durationLabel(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}

export function CreateCourtDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("00:00");
  const [duration, setDuration] = useState("90");
  const [courtType, setCourtType] = useState<"INDOOR" | "OUTDOOR">("INDOOR");
  const createCourt = useCreateCourt();

  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !priceValid) return;
    createCourt.mutate(
      {
        name: trimmed,
        priceCents: Math.round(priceNumber * 100),
        openTime,
        closeTime,
        slotDurationMinutes: Number(duration),
        courtType,
      },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
          setOpenTime("09:00");
          setCloseTime("00:00");
          setDuration("90");
          setCourtType("INDOOR");
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Nueva cancha
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cancha</DialogTitle>
          <DialogDescription>
            Agregá una cancha sobre la que vas a ofrecer turnos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-name">Nombre</Label>
            <Input
              id="court-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Cancha 3"
              autoFocus
              maxLength={80}
              disabled={createCourt.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-price">Precio del turno (ARS)</Label>
            <Input
              id="court-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="12000"
              disabled={createCourt.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-open">Apertura</Label>
              <Input
                id="court-open"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                disabled={createCourt.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-close">Cierre</Label>
              <Input
                id="court-close"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                disabled={createCourt.isPending}
              />
              <p className="text-muted-foreground text-xs">
                00:00 = medianoche · menor a la apertura = cierra al día siguiente
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Duración del turno</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v ?? "90")}>
              <SelectTrigger disabled={createCourt.isPending}>
                <SelectValue>{(v) => durationLabel(Number(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {durationLabel(minutes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              90 min es el estándar de pádel; usá 60 min para fútbol 5 u otros deportes.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <div className="flex gap-4">
              {(["INDOOR", "OUTDOOR"] as const).map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="court-type"
                    value={type}
                    checked={courtType === type}
                    onChange={() => setCourtType(type)}
                    disabled={createCourt.isPending}
                    className="accent-[var(--brand)]"
                  />
                  {type === "INDOOR" ? "Interior" : "Exterior"}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={createCourt.isPending || !name.trim() || !priceValid}
            >
              {createCourt.isPending ? "Creando…" : "Crear cancha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
