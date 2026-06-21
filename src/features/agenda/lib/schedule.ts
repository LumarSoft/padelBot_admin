export interface ScheduleBand {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

const SLOT_DURATION_MINUTES = 90;

/**
 * Generates the daily schedule bands for a court from its openTime/closeTime.
 * closeTime "00:00" means midnight (end of the calendar day).
 */
export function generateSchedule(openTime: string, closeTime: string): ScheduleBand[] {
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);

  let cursor = oh * 60 + om;
  const endOfDay = ch === 0 && cm === 0 ? 24 * 60 : ch * 60 + cm;

  const bands: ScheduleBand[] = [];
  while (cursor + SLOT_DURATION_MINUTES <= endOfDay) {
    const next = cursor + SLOT_DURATION_MINUTES;
    const sh = Math.floor(cursor / 60);
    const sm = cursor % 60;
    const eh = Math.floor(next / 60) % 24;
    const em = next % 60;
    bands.push({
      start: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
      end:
        next >= 24 * 60
          ? "00:00"
          : `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
    });
    cursor = next;
  }
  return bands;
}

/** Today as a local "YYYY-MM-DD" string. */
export function todayKey(): string {
  return dateToKey(new Date());
}

/** Local Date → "YYYY-MM-DD" (no UTC shift). */
export function dateToKey(date: Date): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Shift a "YYYY-MM-DD" key by a number of days. */
export function shiftDay(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T00:00`);
  d.setDate(d.getDate() + days);
  return dateToKey(d);
}

/** ISO range [00:00, 23:59:59] for a day, to query slots/bookings. */
export function dayRange(dayKey: string): { from: string; to: string } {
  return {
    from: new Date(`${dayKey}T00:00:00`).toISOString(),
    to: new Date(`${dayKey}T23:59:59`).toISOString(),
  };
}

/**
 * Concrete start/end ISO datetimes for a band on a given day.
 * A band ending at "00:00" closes on the following calendar day.
 */
export function buildSlotDateTimes(
  dayKey: string,
  band: ScheduleBand,
): { startsAt: string; endsAt: string } {
  const startsAt = new Date(`${dayKey}T${band.start}:00`);
  const endsAt =
    band.end === "00:00"
      ? new Date(`${shiftDay(dayKey, 1)}T00:00:00`)
      : new Date(`${dayKey}T${band.end}:00`);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

/** "HH:MM" of a local datetime, for matching a slot to its band. */
export function localHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Human label for a day key, e.g. "miércoles 25 de junio". */
export function formatDayLabel(dayKey: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dayKey}T00:00`));
}
