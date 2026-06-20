import type { SlotStatus } from "@/types/api/turnos";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

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
  status: BookingStatus;
  notes: string | null;
  recurringBookingId: string | null;
  bookedByUserId: number | null;
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
