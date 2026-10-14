"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlotPicker } from "./slot-picker";
import { useRescheduleBooking } from "@/features/reservas/hooks/use-bookings";
import { useEnsureSlot } from "@/features/reservas/hooks/use-ensure-slot";
import type { SlotOption } from "@/features/reservas/lib/slot-options";
import { dateToKey, todayKey } from "@/features/agenda/lib/schedule";
import { formatDay, formatTimeRange } from "@/lib/format";
import type { Booking } from "@/types/api/bookings";

interface RescheduleBookingDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Opens on the booking's own day (most moves are to another hour that day), or today if it passed. */
function initialDate(booking: Booking): string {
  const bookingDay = dateToKey(new Date(booking.slot.startsAt));
  const today = todayKey();
  return bookingDay > today ? bookingDay : today;
}

export function RescheduleBookingDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleBookingDialogProps) {
  const [date, setDate] = useState(() => initialDate(booking));
  const [courtId, setCourtId] = useState("");
  const [target, setTarget] = useState<SlotOption | null>(null);
  const ensureSlot = useEnsureSlot();
  const reschedule = useRescheduleBooking();

  function handleClose(v: boolean) {
    if (!v) {
      setDate(initialDate(booking));
      setCourtId("");
      setTarget(null);
    }
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (!target) return;
    // A band nobody used yet has no Slot row: create it first, like the Agenda does to book one.
    const newSlotId = await ensureSlot.mutateAsync(target).catch(() => null);
    if (!newSlotId) return;
    reschedule.mutate(
      { id: booking.id, body: { newSlotId } },
      { onSuccess: () => handleClose(false) },
    );
  }

  const pending = ensureSlot.isPending || reschedule.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reprogramar reserva</DialogTitle>
          <DialogDescription>
            Reserva actual de{" "}
            <span className="text-foreground font-medium">{booking.playerName}</span>:{" "}
            {booking.slot.court.name} ·{" "}
            {formatDay(booking.slot.startsAt)} ·{" "}
            {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4" data-help="reprogramar-turno">
          <p className="text-muted-foreground text-sm">
            Elegí el nuevo turno al que querés mover esta reserva.
          </p>
          <SlotPicker
            date={date}
            courtId={courtId}
            value={target}
            onDateChange={setDate}
            onCourtChange={setCourtId}
            onChange={setTarget}
            excludeSlotId={booking.slotId}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            data-help="reprogramar-confirmar"
            disabled={!target || pending}
          >
            {pending ? "Reprogramando…" : "Reprogramar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
