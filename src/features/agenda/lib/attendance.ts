import type { Booking } from "@/types/api/bookings";

/**
 * Where a fijo stands on the WhatsApp "¿venís?" (see the API's FixedConfirmationsService):
 * confirmed = tocó "Sí, voy" (or the desk marked it), declined = "No puedo" (that date was
 * released), unanswered = we asked and they didn't answer, notAsked = no question went out yet.
 */
export type AttendanceState = "confirmed" | "declined" | "unanswered" | "notAsked";

/** Null for a booking that isn't a fijo. */
export function attendanceState(booking: Booking): AttendanceState | null {
  if (!booking.recurringBookingId) return null;
  if (booking.attendanceConfirmed === true) return "confirmed";
  if (booking.attendanceConfirmed === false) return "declined";
  return booking.attendanceAskedAt ? "unanswered" : "notAsked";
}

/**
 * The bot asks on a 5-minute sweep; give it a few minutes before calling a question that hasn't
 * gone out "missed".
 */
const ASK_GRACE_MS = 10 * 60_000;

/** When the bot asks (or asked) this fijo: `leadHours` before the turno. */
export function askTime(booking: Booking, leadHours: number): Date {
  return new Date(new Date(booking.slot.startsAt).getTime() - leadHours * 3_600_000);
}

export interface FijoToCall {
  booking: Booking;
  /** unanswered = got the WhatsApp and didn't answer; notReached = the WhatsApp never went out. */
  reason: "unanswered" | "notReached";
}

/**
 * The fijos the front desk has to call: still booked, no answer, the turno hasn't ended, and
 * either they didn't answer the WhatsApp, or the time to ask passed and it never went out (no
 * phone, the template wasn't approved, the fijo was loaded or the feature turned on too late).
 * A fijo whose question is still ahead isn't listed — the bot will ask them.
 */
export function fijosToCall(bookings: Booking[], leadHours: number, now = Date.now()): FijoToCall[] {
  const toCall: FijoToCall[] = [];
  for (const booking of bookings) {
    if (booking.status !== "CONFIRMED" || attendanceState(booking) === null) continue;
    if (booking.attendanceConfirmed !== null) continue;
    if (new Date(booking.slot.endsAt).getTime() <= now) continue;

    if (booking.attendanceAskedAt) {
      toCall.push({ booking, reason: "unanswered" });
    } else if (askTime(booking, leadHours).getTime() + ASK_GRACE_MS <= now) {
      toCall.push({ booking, reason: "notReached" });
    }
  }
  return toCall.sort((a, b) => a.booking.slot.startsAt.localeCompare(b.booking.slot.startsAt));
}

/** `tel:` link for a phone typed by hand ("341 555-1234" → "tel:3415551234"). */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
