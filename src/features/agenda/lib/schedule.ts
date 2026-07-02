export interface ScheduleBand {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

const SLOT_DURATION_MINUTES = 90;

/**
 * The club's wall-clock timezone. Every slot is an absolute UTC instant in the DB,
 * but the club, its players and the bot all reason in this single timezone. Building
 * a slot's instant with `new Date("YYYY-MM-DDTHH:MM")` is wrong: it is parsed in the
 * *browser's* timezone, so an admin whose machine isn't on club time stores the slot
 * at the wrong UTC instant — and the bot (which pins to the club timezone) then can't
 * see it as occupied and offers the court as free. Pin every conversion here so the
 * panel and the bot agree regardless of where the browser runs. Mirrors the API's
 * `availability/lib/datetime.ts`.
 */
export const CLUB_TIMEZONE =
  process.env.NEXT_PUBLIC_CLUB_TIMEZONE ?? "America/Argentina/Buenos_Aires";

/** Offset (in ms) of `CLUB_TIMEZONE` at a given absolute instant. East of UTC is positive. */
function clubTzOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  const hour = map.hour === 24 ? 0 : map.hour; // Intl can emit "24" for midnight
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return asUtc - instant.getTime();
}

/** A wall-clock time in the club timezone → the matching UTC `Date`. */
function clubWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Assume the wall time is UTC, then correct by the real offset at that instant.
  // One correction is exact for a fixed-offset zone (Argentina has no DST).
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(guess - clubTzOffsetMs(new Date(guess)));
}

/** UTC `Date` for a wall-clock "HH:MM" on a "YYYY-MM-DD" key, in the club timezone. */
export function wallTimeToUtc(dayKey: string, hhmm: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  return clubWallTimeToUtc(y, m, d, hh, mm);
}

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

/** Today as a club-local "YYYY-MM-DD" string. */
export function todayKey(): string {
  return dateToKey(new Date());
}

/** Absolute instant → "YYYY-MM-DD" in the club timezone. */
export function dateToKey(date: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Shift a "YYYY-MM-DD" key by a number of days (UTC calendar arithmetic, TZ-independent). */
export function shiftDay(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** ISO range covering one club-local calendar day, to query slots/bookings. */
export function dayRange(dayKey: string): { from: string; to: string } {
  return {
    from: wallTimeToUtc(dayKey, "00:00").toISOString(),
    // End of the club-local day: midnight of the next day, minus 1s.
    to: new Date(wallTimeToUtc(shiftDay(dayKey, 1), "00:00").getTime() - 1000).toISOString(),
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
  const startsAt = wallTimeToUtc(dayKey, band.start);
  const endsAt =
    band.end === "00:00"
      ? wallTimeToUtc(shiftDay(dayKey, 1), "00:00")
      : wallTimeToUtc(dayKey, band.end);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

/** "HH:MM" of a slot instant in the club timezone, for matching a slot to its band. */
export function localHHMM(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLUB_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Human label for a day key, e.g. "miércoles 25 de junio". */
export function formatDayLabel(dayKey: string): string {
  // Read the label at club-local noon so the weekday never drifts to an adjacent day.
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: CLUB_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(wallTimeToUtc(dayKey, "12:00"));
}
