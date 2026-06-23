/**
 * Centralized React Query keys. Reference these constants everywhere instead of
 * inlining string arrays, so cache invalidation stays consistent.
 */
import type { SlotFilters } from "@/types/api/turnos";
import type { BookingFilters } from "@/types/api/bookings";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  courts: {
    all: ["courts"] as const,
  },
  slots: {
    all: ["slots"] as const,
    list: (filters: SlotFilters) => ["slots", "list", filters] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (filters: BookingFilters) => ["bookings", "list", filters] as const,
  },
  recurringBookings: {
    all: ["recurring-bookings"] as const,
  },
  clubs: {
    profile: ["clubs", "profile"] as const,
    transferConfig: ["clubs", "transfer-config"] as const,
    mercadopago: ["clubs", "mercadopago"] as const,
  },
  stats: {
    overview: ["stats", "overview"] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    list: ["conversations", "list"] as const,
    messages: (id: string) => ["conversations", "messages", id] as const,
  },
} as const;
