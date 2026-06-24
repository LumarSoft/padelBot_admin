import type { SlotStatus } from "@/types/api/turnos";

export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

export interface BookingSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: SlotStatus;
  court: { id: string; name: string };
}

export interface Booking {
  id: string;
  slotId: string;
  clubId: string;
  playerName: string;
  playerPhone: string | null;
  /** DNI captured at booking for payer validation (digits), or null. */
  playerDni: string | null;
  /** CUIT/identification of who actually transferred (from MercadoPago), or null. */
  payerCuit: string | null;
  /** Email of who actually transferred, or null. */
  payerEmail: string | null;
  status: BookingStatus;
  notes: string | null;
  recurringBookingId: string | null;
  bookedByUserId: number | null;
  /** Deposit owed (cents) — court price split across the 4 players. */
  depositCents: number;
  /** Exact amount (cents, with centavos) the player must transfer to confirm. Null for admin-created bookings. */
  transferAmountCents: number | null;
  /** When the pending transfer window expires (ISO). Null for admin-created bookings. */
  paymentExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  slot: BookingSlot;
}

export interface BookingFilters {
  from?: string;
  to?: string;
  courtId?: string;
  status?: BookingStatus;
  playerPhone?: string;
}

export interface CreateBookingRequest {
  slotId: string;
  playerName: string;
  playerPhone?: string;
  notes?: string;
}

export interface RescheduleBookingRequest {
  newSlotId: string;
}
