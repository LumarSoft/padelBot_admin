export interface RecurringBooking {
  id: string;
  clubId: string;
  courtId: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  slotStart: string; // "HH:MM"
  slotEnd: string; // "HH:MM"
  playerName: string;
  playerPhone: string;
  priceCents: number;
  notes: string | null;
  /** Block weekly occurrences only up to this day (ISO). Null = rolling window. */
  untilDate: string | null;
  isActive: boolean;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  court: { id: string; name: string };
}

export interface CreateRecurringBookingRequest {
  courtId: string;
  dayOfWeek: number;
  slotStart: string;
  slotEnd: string;
  playerName: string;
  playerPhone: string;
  priceCents: number;
  notes?: string;
  /** "YYYY-MM-DD" — block weekly occurrences only up to this day. Omit = rolling window. */
  untilDate?: string;
}

export interface UpdateRecurringBookingRequest {
  playerName?: string;
  playerPhone?: string;
  priceCents?: number;
  notes?: string;
  isActive?: boolean;
}

export interface ApplyRecurringBookingResult {
  applied: number;
}
