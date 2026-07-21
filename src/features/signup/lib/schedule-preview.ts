/** Turno length used to draw the preview when they answered "depende de la cancha". */
export const FALLBACK_DURATION = 90;

/**
 * The day the schedule question opens on — the most common one, so a club that matches it
 * can just hit Continuar. These are REAL answers seeded into the flow's state, not merely
 * something drawn on screen: if the field only displayed them, the question would read as
 * unanswered and the hours we showed would never be sent.
 */
export const DEFAULT_OPEN = "09:00";
export const DEFAULT_CLOSE = "00:00";

/** The day closes at midnight at the latest — 24:00 in minutes. */
export const DAY_END = 24 * 60;

export interface Band {
  start: string;
  end: string;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  const capped = minutes % (24 * 60);
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * The turnos a day actually yields, given when they open, when they close and how long a
 * turno runs. This is exactly how the club will experience the system, so showing it here
 * turns an abstract pair of times into something they can check against their own reality
 * ("sí, arranco 9 y el último es 22:30") — and lets them catch a wrong answer before we do.
 *
 * A trailing gap too short for another turno is simply not offered, same as in the panel.
 */
export function bandsFor(open: string, close: string, durationMinutes: number): Band[] {
  const start = toMinutes(open);
  // "00:00" as a closing time means midnight at the END of the day, not the start of it.
  const rawEnd = toMinutes(close);
  const end = rawEnd === 0 ? DAY_END : rawEnd;

  if (!Number.isFinite(start) || end <= start || durationMinutes <= 0) return [];

  const bands: Band[] = [];
  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    bands.push({ start: toTime(t), end: toTime(t + durationMinutes) });
    // A club can't have a hundred turnos; bail out rather than hang on absurd input.
    if (bands.length >= 24) break;
  }
  return bands;
}

/** Opening-time options, on the half hour. Clubs don't open at 09:07. */
export function openOptions(): string[] {
  const options: string[] = [];
  for (let t = 6 * 60; t <= 18 * 60; t += 30) options.push(toTime(t));
  return options;
}

/**
 * Closing-time options: every half hour after the first turno could possibly end, up to
 * midnight. Offering a close before the club could fit a single turno is just a trap.
 */
export function closeOptions(open: string, durationMinutes: number): string[] {
  const first = toMinutes(open) + durationMinutes;
  const options: string[] = [];
  for (let t = Math.max(first, toMinutes(open) + 30); t <= DAY_END; t += 30) {
    options.push(toTime(t));
  }
  return options;
}
