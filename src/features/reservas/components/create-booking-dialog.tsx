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
import { useEnsureSlot } from "@/features/reservas/hooks/use-ensure-slot";
import type { SlotOption } from "@/features/reservas/lib/slot-options";
import { todayKey } from "@/features/agenda/lib/schedule";

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayKey);
  const [courtId, setCourtId] = useState("");
  const [target, setTarget] = useState<SlotOption | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const ensureSlot = useEnsureSlot();
  const createBooking = useCreateBooking();

  function reset() {
    setDate(todayKey());
    setCourtId("");
    setTarget(null);
    setPlayerName("");
    setPlayerPhone("");
    setNotes("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!target || !playerName.trim()) return;
    const slotId = await ensureSlot.mutateAsync(target).catch(() => null);
    if (!slotId) return;
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

  const pending = ensureSlot.isPending || createBooking.isPending;
  const canSubmit = !!target && !!playerName.trim() && !pending;

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
            value={target}
            onDateChange={setDate}
            onCourtChange={setCourtId}
            onChange={setTarget}
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
              {pending ? "Reservando…" : "Crear reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
