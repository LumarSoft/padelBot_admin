export interface ScheduleBand {
  start: string; // "HH:MM" wall-clock
  end: string; // "HH:MM" wall-clock
  /** Days past the grid's dayKey where the band starts (1 = past midnight). */
  startOffset: number;
  /** Days past the grid's dayKey where the band ends. */
  endOffset: number;
}

export const DEFAULT_SLOT_DURATION_MINUTES = 90;

/** Opening hours for one day. `close` ≤ `open` means the court closes past midnight. */
export interface DayHours {
  open: string;
  close: string;
}

/**
 * Per-weekday overrides keyed "0" (Sunday) … "6" (Saturday). A missing key falls
 * back to the court's default openTime/closeTime; an explicit null closes that day.
 */
export type WeeklyHours = Partial<
  Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", DayHours | null>
>;

/** The schedule-relevant fields of a Court (mirrors the API's CourtSchedule). */
export interface CourtScheduleConfig {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  weeklyHours?: WeeklyHours | null;
}

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

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(totalMinutes: number): string {
  const inDay = ((totalMinutes % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(inDay / 60))}:${pad(inDay % 60)}`;
}

/**
 * Generates the schedule bands for one day from opening hours and a band duration.
 * A close time ≤ the open time crosses midnight ("00:00" = midnight, "01:00" = 1 AM
 * of the next day); offsets say on which calendar day relative to the grid's dayKey
 * a band actually starts/ends. Mirrors the API's `generateBands`.
 */
export function generateSchedule(
  openTime: string,
  closeTime: string,
  slotDurationMinutes: number = DEFAULT_SLOT_DURATION_MINUTES,
): ScheduleBand[] {
  const open = minutesOf(openTime);
  let close = minutesOf(closeTime);
  if (close <= open) close += 1440;

  const bands: ScheduleBand[] = [];
  let cursor = open;
  while (cursor + slotDurationMinutes <= close) {
    const next = cursor + slotDurationMinutes;
    bands.push({
      start: formatMinutes(cursor),
      end: formatMinutes(next),
      startOffset: Math.floor(cursor / 1440),
      endOffset: Math.floor(next / 1440),
    });
    cursor = next;
  }
  return bands;
}

/** Day of week (0 = Sunday … 6 = Saturday) of a "YYYY-MM-DD" key. */
export function weekdayOfKey(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  // Read the weekday at UTC noon so it never drifts to the adjacent day.
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** Effective opening hours of a court on a weekday; null = closed that day. */
export function hoursForWeekday(
  court: CourtScheduleConfig,
  weekday: number,
): DayHours | null {
  const key = String(weekday) as keyof WeeklyHours;
  const weekly = court.weeklyHours;
  if (weekly && key in weekly) return weekly[key] ?? null;
  return { open: court.openTime, close: court.closeTime };
}

/** The bands a court offers on a weekday (0 = Sunday … 6 = Saturday). */
export function bandsForWeekday(
  court: CourtScheduleConfig,
  weekday: number,
): ScheduleBand[] {
  const hours = hoursForWeekday(court, weekday);
  if (!hours) return [];
  return generateSchedule(hours.open, hours.close, court.slotDurationMinutes);
}

/** The bands a court offers on a specific club-local day (weekday-aware). */
export function bandsForDate(court: CourtScheduleConfig, dayKey: string): ScheduleBand[] {
  return bandsForWeekday(court, weekdayOfKey(dayKey));
}

/** Minutes since the grid day's midnight — chronological sort key across midnight. */
export function bandSortMinutes(band: ScheduleBand): number {
  return band.startOffset * 1440 + minutesOf(band.start);
}

/**
 * Union of a court's bands across every weekday (deduped by start time), in
 * chronological order — for pickers not tied to a specific date (bulk block,
 * price rules).
 */
export function allBandsForCourt(court: CourtScheduleConfig): ScheduleBand[] {
  const seen = new Set<string>();
  const all: ScheduleBand[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (const band of bandsForWeekday(court, weekday)) {
      if (!seen.has(band.start)) {
        seen.add(band.start);
        all.push(band);
      }
    }
  }
  return all.sort((a, b) => bandSortMinutes(a) - bandSortMinutes(b));
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
 * ISO range covering one day's grid for a set of courts. Unlike `dayRange`, the end
 * extends to the latest band end across the courts, so a grid that closes past
 * midnight ("viernes hasta la 1 AM") still pulls the slots of its late bands.
 */
export function dayRangeForCourts(
  dayKey: string,
  courts: CourtScheduleConfig[],
): { from: string; to: string } {
  let latestEnd = wallTimeToUtc(shiftDay(dayKey, 1), "00:00").getTime() - 1000;
  for (const court of courts) {
    for (const band of bandsForDate(court, dayKey)) {
      const { endsAt } = buildSlotDateTimes(dayKey, band);
      latestEnd = Math.max(latestEnd, new Date(endsAt).getTime());
    }
  }
  return {
    from: wallTimeToUtc(dayKey, "00:00").toISOString(),
    to: new Date(latestEnd).toISOString(),
  };
}

/** Concrete start/end ISO datetimes for a band on a given day (offset-aware). */
export function buildSlotDateTimes(
  dayKey: string,
  band: ScheduleBand,
): { startsAt: string; endsAt: string } {
  const startsAt = wallTimeToUtc(
    band.startOffset ? shiftDay(dayKey, band.startOffset) : dayKey,
    band.start,
  );
  const endsAt = wallTimeToUtc(
    band.endOffset ? shiftDay(dayKey, band.endOffset) : dayKey,
    band.end,
  );
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
