/**
 * Fixed slot schedule for every club (see project domain).
 * Each entry is a bookable time band; "22:30" closes at midnight (next day 00:00).
 */
export interface ScheduleBand {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export const SCHEDULE: ScheduleBand[] = [
  { start: "09:00", end: "10:30" },
  { start: "10:30", end: "12:00" },
  { start: "12:00", end: "13:30" },
  { start: "13:30", end: "15:00" },
  { start: "15:00", end: "16:30" },
  { start: "16:30", end: "18:00" },
  { start: "18:00", end: "19:30" },
  { start: "19:30", end: "21:00" },
  { start: "21:00", end: "22:30" },
  { start: "22:30", end: "00:00" },
];

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
