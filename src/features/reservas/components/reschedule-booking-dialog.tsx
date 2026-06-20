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
import { formatDay, formatTimeRange } from "@/lib/format";
import type { Booking } from "@/types/api/bookings";

interface RescheduleBookingDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function todayStr(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function RescheduleBookingDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleBookingDialogProps) {
  const [date, setDate] = useState(todayStr);
  const [courtId, setCourtId] = useState("");
  const [newSlotId, setNewSlotId] = useState("");
  const reschedule = useRescheduleBooking();

  function handleClose(v: boolean) {
    if (!v) {
      setDate(todayStr());
      setCourtId("");
      setNewSlotId("");
    }
    onOpenChange(v);
  }

  function handleSubmit() {
    if (!newSlotId) return;
    reschedule.mutate(
      { id: booking.id, body: { newSlotId } },
      { onSuccess: () => handleClose(false) },
    );
  }

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

        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Elegí el nuevo turno al que querés mover esta reserva.
          </p>
          <SlotPicker
            date={date}
            courtId={courtId}
            slotId={newSlotId}
            onDateChange={setDate}
            onCourtChange={setCourtId}
            onSlotChange={setNewSlotId}
            excludeSlotId={booking.slotId}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!newSlotId || reschedule.isPending}
          >
            {reschedule.isPending ? "Reprogramando…" : "Reprogramar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
