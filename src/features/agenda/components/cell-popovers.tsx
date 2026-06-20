"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarClock, Lock, MessageCircle, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { ApiError } from "@/lib/api/api-error";
import { slotsService } from "@/services/slots.service";
import { buildSlotDateTimes, type ScheduleBand } from "@/features/agenda/lib/schedule";
import { useCreateBooking, useCancelBooking } from "@/features/reservas/hooks/use-bookings";
import { useCreateSlot, useUpdateSlot, useDeleteSlot } from "@/features/turnos/hooks/use-slots";
import type { Slot } from "@/types/api/turnos";
import type { Booking } from "@/types/api/bookings";

interface ReserveCellProps {
  slot?: Slot;
  courtId: string;
  courtName: string;
  /** Court default price, used when the slot does not exist yet. */
  priceCents: number;
  dayKey: string;
  band: ScheduleBand;
  onDone: () => void;
}

/**
 * Body for a free cell — whether the slot already exists (AVAILABLE) or has to
 * be materialized on the fly at the court's price. Reserve with name + optional
 * phone, or block the slot.
 */
export function ReserveCellForm({
  slot,
  courtId,
  courtName,
  priceCents,
  dayKey,
  band,
  onDone,
}: ReserveCellProps) {
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [creatingSlot, setCreatingSlot] = useState(false);

  const createBooking = useCreateBooking();
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();

  const effectivePrice = slot?.priceCents ?? priceCents;
  const busy = creatingSlot || createBooking.isPending || updateSlot.isPending || createSlot.isPending;

  async function ensureSlotId(): Promise<string | null> {
    if (slot) return slot.id;
    const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
    try {
      setCreatingSlot(true);
      const created = await slotsService.create({ courtId, startsAt, endsAt, priceCents });
      return created.id;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo crear el turno");
      return null;
    } finally {
      setCreatingSlot(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!playerName.trim()) return;
    const slotId = await ensureSlotId();
    if (!slotId) return;
    createBooking.mutate(
      {
        slotId,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onDone },
    );
  }

  function handleBlock() {
    if (slot) {
      updateSlot.mutate({ id: slot.id, body: { status: "BLOCKED" } }, { onSuccess: onDone });
      return;
    }
    const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
    createSlot.mutate(
      { courtId, startsAt, endsAt, priceCents, status: "BLOCKED" },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5">
        <p className="font-heading text-sm font-medium">{courtName}</p>
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <CalendarClock className="size-3" />
          {slot ? formatTimeRange(slot.startsAt, slot.endsAt) : `${band.start} – ${band.end}`} ·{" "}
          {formatPrice(effectivePrice)}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-name">Jugador</Label>
        <Input
          id="cell-name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Juan Pérez"
          maxLength={100}
          autoFocus
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-phone">
          Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="cell-phone"
          value={playerPhone}
          onChange={(e) => setPlayerPhone(e.target.value)}
          placeholder="+54911…"
          maxLength={20}
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-notes">
          Notas <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="cell-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones…"
          maxLength={500}
          disabled={busy}
        />
      </div>

      <Button type="submit" disabled={busy || !playerName.trim()} className="w-full">
        {creatingSlot || createBooking.isPending ? "Reservando…" : "Reservar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={handleBlock}
        className="text-muted-foreground"
      >
        <Lock className="size-3.5" />
        Bloquear turno
      </Button>
    </form>
  );
}

/** Body shown when clicking a BOOKED cell: contact + manage the reservation. */
export function BookingActions({
  booking,
  onReschedule,
  onDone,
}: {
  booking: Booking;
  onReschedule: () => void;
  onDone: () => void;
}) {
  const cancelBooking = useCancelBooking();

  function handleCancel() {
    if (
      window.confirm(
        `¿Cancelar la reserva de ${booking.playerName} (${formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)})?`,
      )
    ) {
      cancelBooking.mutate(booking.id, { onSuccess: onDone });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="font-heading text-sm font-medium">{booking.playerName}</p>
          {booking.recurringBookingId && (
            <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-medium">
              Fijo
            </span>
          )}
        </div>
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <CalendarClock className="size-3" />
          {booking.slot.court.name} · {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
        </p>
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Phone className="size-3" />
          {booking.playerPhone || "Sin teléfono"} · {formatPrice(booking.slot.priceCents)}
        </p>
        {booking.notes && (
          <p className="text-muted-foreground mt-1 text-xs italic">“{booking.notes}”</p>
        )}
      </header>

      {booking.playerPhone && (
        <a
          href={waLink(booking.playerPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-3.5" />
          Abrir WhatsApp
        </a>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReschedule}
          className="flex-1"
        >
          Reprogramar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={cancelBooking.isPending}
          className="text-muted-foreground hover:text-destructive flex-1"
        >
          {cancelBooking.isPending ? "Cancelando…" : "Cancelar"}
        </Button>
      </div>
    </div>
  );
}

/** Body shown when clicking a BLOCKED cell: free it or delete it. */
export function BlockedActions({ slot, onDone }: { slot: Slot; onDone: () => void }) {
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();
  const busy = updateSlot.isPending || deleteSlot.isPending;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5">
        <p className="font-heading text-sm font-medium">{slot.court.name}</p>
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <CalendarClock className="size-3" />
          {formatTimeRange(slot.startsAt, slot.endsAt)} · Bloqueado
        </p>
      </header>
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() =>
          updateSlot.mutate({ id: slot.id, body: { status: "AVAILABLE" } }, { onSuccess: onDone })
        }
        className="w-full"
      >
        Liberar turno
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => deleteSlot.mutate(slot.id, { onSuccess: onDone })}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Eliminar turno
      </Button>
    </div>
  );
}
