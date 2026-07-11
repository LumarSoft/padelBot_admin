"use client";

import { useMemo } from "react";
import { useSlots } from "@/features/turnos/hooks/use-slots";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { dayRange, dayRangeForCourts, localHHMM } from "@/features/agenda/lib/schedule";
import type { Court, Slot } from "@/types/api/turnos";
import type { Booking } from "@/types/api/bookings";

export interface AgendaCellData {
  slot?: Slot;
  /** A CONFIRMED reservation occupying this band. */
  booking?: Booking;
  /** A PENDING_PAYMENT hold: the slot is locked while the player pays the seña. */
  pending?: Booking;
  /** True when a reservation here was cancelled and the band is free again ("recién liberado"). */
  freed?: boolean;
}

/**
 * Loads everything needed to render the agenda grid for a single day, indexed by
 * `${courtId}__${HH:MM}` so a cell lookup is O(1):
 *  - slots and CONFIRMED bookings (what occupies each band),
 *  - PENDING_PAYMENT holds (so an unpaid reservation isn't shown as "Libre"),
 *  - CANCELLED bookings (so a freed band reads "Liberado", not a plain "Libre").
 */
export function useAgendaDay(dayKey: string, courtId?: string, courts?: Court[]) {
  // With courts at hand the range extends past midnight when a schedule closes late
  // ("viernes hasta la 1 AM"), so the late bands' slots are included.
  const range = courts?.length ? dayRangeForCourts(dayKey, courts) : dayRange(dayKey);
  const filters = { from: range.from, to: range.to, courtId: courtId || undefined };

  const slotsQuery = useSlots(filters);
  const bookingsQuery = useBookings({ ...filters, status: "CONFIRMED" });
  const pendingQuery = useBookings({ ...filters, status: "PENDING_PAYMENT" });
  const cancelledQuery = useBookings({ ...filters, status: "CANCELLED" });

  const cells = useMemo(() => {
    const map = new Map<string, AgendaCellData>();
    const upsert = (key: string, patch: Partial<AgendaCellData>) =>
      map.set(key, { ...(map.get(key) ?? {}), ...patch });

    for (const slot of slotsQuery.data ?? []) {
      upsert(cellKey(slot.courtId, slot.startsAt), { slot });
    }
    // A cancelled booking marks its band as "freed" — overridden below if it was re-taken.
    for (const booking of cancelledQuery.data ?? []) {
      upsert(cellKey(booking.slot.court.id, booking.slot.startsAt), { freed: true });
    }
    for (const pending of pendingQuery.data ?? []) {
      upsert(cellKey(pending.slot.court.id, pending.slot.startsAt), { pending, freed: false });
    }
    for (const booking of bookingsQuery.data ?? []) {
      upsert(cellKey(booking.slot.court.id, booking.slot.startsAt), { booking, freed: false });
    }
    return map;
  }, [slotsQuery.data, bookingsQuery.data, pendingQuery.data, cancelledQuery.data]);

  function cellFor(courtIdValue: string, bandStart: string): AgendaCellData {
    return cells.get(`${courtIdValue}__${bandStart}`) ?? {};
  }

  return {
    cellFor,
    isLoading:
      slotsQuery.isLoading ||
      bookingsQuery.isLoading ||
      pendingQuery.isLoading ||
      cancelledQuery.isLoading,
  };
}

function cellKey(courtId: string, startsAtIso: string): string {
  return `${courtId}__${localHHMM(startsAtIso)}`;
}
