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
import { SlotPicker } from "./slot-picker";
import { useCreateBooking } from "@/features/reservas/hooks/use-bookings";

function todayStr(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr);
  const [courtId, setCourtId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const createBooking = useCreateBooking();

  function reset() {
    setDate(todayStr());
    setCourtId("");
    setSlotId("");
    setPlayerName("");
    setPlayerPhone("");
    setNotes("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!slotId || !playerName.trim()) return;
    createBooking.mutate(
      {
        slotId,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  const canSubmit = !!slotId && !!playerName.trim() && !createBooking.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nueva reserva
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            Seleccioná un turno disponible y completá los datos del jugador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <SlotPicker
            date={date}
            courtId={courtId}
            slotId={slotId}
            onDateChange={setDate}
            onCourtChange={setCourtId}
            onSlotChange={setSlotId}
          />

          <div className="border-t pt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bk-name">Nombre del jugador</Label>
                <Input
                  id="bk-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Juan Pérez"
                  maxLength={100}
                  disabled={createBooking.isPending}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bk-phone">
                  Teléfono{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="bk-phone"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  placeholder="+54911..."
                  maxLength={20}
                  disabled={createBooking.isPending}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bk-notes">
                Notas{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="bk-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones…"
                maxLength={500}
                disabled={createBooking.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {createBooking.isPending ? "Reservando…" : "Crear reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
