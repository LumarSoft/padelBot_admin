import type { BookingStatus } from "@/types/api/bookings";

export interface Player {
  id: string;
  phone: string;
  name: string | null;
  dni: string | null;
  noShowCount: number;
  creditCents: number;
  isBlocked: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerListItem extends Player {
  bookingsCount: number;
}

export interface PlayerBooking {
  id: string;
  status: BookingStatus;
  noShowAt: string | null;
  depositCents: number;
  createdAt: string;
  slot: {
    startsAt: string;
    endsAt: string;
    court: { name: string };
  };
}

export interface PlayerDetail extends Player {
  bookings: PlayerBooking[];
}

export interface UpdatePlayerRequest {
  name?: string;
  isBlocked?: boolean;
  notes?: string;
}
