import {
  bandsForDate,
  buildSlotDateTimes,
  dateToKey,
  resolveBandPriceCents,
} from "@/features/agenda/lib/schedule";
import type { Court, Slot } from "@/types/api/turnos";

/**
 * A turno a picker can offer: a free band of a court's schedule, whether or not its Slot row
 * exists yet. The Agenda works the same way — it renders every band of the schedule and only
 * materializes the Slot when the cell is actually used (see `useEnsureSlot`).
 */
export interface SlotOption {
  /** Stable select value: one per court and start instant. */
  key: string;
  courtId: string;
  courtName: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  /** The AVAILABLE Slot already backing this band; absent = created when the option is used. */
  slotId?: string;
}

function optionKey(courtId: string, startsAt: string): string {
  return `${courtId}__${Date.parse(startsAt)}`;
}

/**
 * The free turnos of one club-local day, open-by-default like the Agenda and the bot
 * (`api/src/availability/availability.service.ts#slotsForDate`): every band of each court's
 * schedule is free unless a BOOKED/BLOCKED slot overlaps it. A band that already ended isn't
 * offered (the Agenda disables those cells too). AVAILABLE slots created off the schedule
 * (Configuración → Turnos) are offered as well. Sorted by time, then court.
 */
export function freeSlotOptions(
  courts: Court[],
  slots: Slot[],
  dayKey: string,
  now: Date = new Date(),
): SlotOption[] {
  const options = new Map<string, SlotOption>();

  for (const court of courts) {
    const courtSlots = slots.filter((s) => s.courtId === court.id);
    // Occupancy is by overlap, not exact start: an off-grid BOOKED/BLOCKED slot still hides
    // every band it touches. Half-open, so a slot merely touching the edge doesn't block.
    const occupied = courtSlots.filter((s) => s.status !== "AVAILABLE");
    const isFree = (startsAt: string, endsAt: string) =>
      Date.parse(endsAt) > now.getTime() &&
      !occupied.some(
        (s) => Date.parse(s.startsAt) < Date.parse(endsAt) && Date.parse(s.endsAt) > Date.parse(startsAt),
      );
    const availableByKey = new Map(
      courtSlots.filter((s) => s.status === "AVAILABLE").map((s) => [optionKey(court.id, s.startsAt), s]),
    );

    for (const band of bandsForDate(court, dayKey)) {
      const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
      if (!isFree(startsAt, endsAt)) continue;
      const key = optionKey(court.id, startsAt);
      const existing = availableByKey.get(key);
      options.set(key, {
        key,
        courtId: court.id,
        courtName: court.name,
        startsAt,
        endsAt,
        // A materialized slot keeps the price it was created with, as the bot quotes it.
        priceCents: existing?.priceCents ?? resolveBandPriceCents(court, dayKey, band.start),
        slotId: existing?.id,
      });
    }

    for (const [key, slot] of availableByKey) {
      if (options.has(key) || dateToKey(new Date(slot.startsAt)) !== dayKey) continue;
      if (!isFree(slot.startsAt, slot.endsAt)) continue;
      options.set(key, {
        key,
        courtId: court.id,
        courtName: court.name,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        priceCents: slot.priceCents,
        slotId: slot.id,
      });
    }
  }

  return [...options.values()].sort(
    (a, b) =>
      Date.parse(a.startsAt) - Date.parse(b.startsAt) ||
      a.courtName.localeCompare(b.courtName, "es", { numeric: true }),
  );
}
