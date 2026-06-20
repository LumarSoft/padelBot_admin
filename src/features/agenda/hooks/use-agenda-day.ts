"use client";

import { useMemo } from "react";
import { useSlots } from "@/features/turnos/hooks/use-slots";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { dayRange, localHHMM } from "@/features/agenda/lib/schedule";
import type { Slot } from "@/types/api/turnos";
import type { Booking } from "@/types/api/bookings";

export interface AgendaCellData {
  slot?: Slot;
  booking?: Booking;
}

/**
 * Loads everything needed to render the agenda grid for a single day: slots and
 * confirmed bookings, indexed by `${courtId}__${HH:MM}` so a cell lookup is O(1).
 */
export function useAgendaDay(dayKey: string, courtId?: string) {
  const range = dayRange(dayKey);

  const slotsQuery = useSlots({
    from: range.from,
    to: range.to,
    courtId: courtId || undefined,
  });
  const bookingsQuery = useBookings({
    from: range.from,
    to: range.to,
    courtId: courtId || undefined,
    status: "CONFIRMED",
  });

  const cells = useMemo(() => {
    const map = new Map<string, AgendaCellData>();
    for (const slot of slotsQuery.data ?? []) {
      map.set(cellKey(slot.courtId, slot.startsAt), { slot });
    }
    for (const booking of bookingsQuery.data ?? []) {
      const key = cellKey(booking.slot.court.id, booking.slot.startsAt);
      const existing = map.get(key) ?? {};
      map.set(key, { ...existing, booking });
    }
    return map;
  }, [slotsQuery.data, bookingsQuery.data]);

  function cellFor(courtIdValue: string, bandStart: string): AgendaCellData {
    return cells.get(`${courtIdValue}__${bandStart}`) ?? {};
  }

  return {
    cellFor,
    isLoading: slotsQuery.isLoading || bookingsQuery.isLoading,
  };
}

function cellKey(courtId: string, startsAtIso: string): string {
  return `${courtId}__${localHHMM(startsAtIso)}`;
}
