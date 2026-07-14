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
    scheduledAdjustments: ["courts", "scheduled-adjustments"] as const,
  },
  priceRules: {
    byCourt: (courtId: string) => ["price-rules", courtId] as const,
  },
  slots: {
    all: ["slots"] as const,
    list: (filters: SlotFilters) => ["slots", "list", filters] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (filters: BookingFilters) => ["bookings", "list", filters] as const,
    account: (id: string) => ["bookings", "account", id] as const,
  },
  recurringBookings: {
    all: ["recurring-bookings"] as const,
  },
  clubs: {
    profile: ["clubs", "profile"] as const,
    transferConfig: ["clubs", "transfer-config"] as const,
    mercadopago: ["clubs", "mercadopago"] as const,
    subscription: ["clubs", "subscription"] as const,
    whatsappLines: ["clubs", "whatsapp-lines"] as const,
  },
  stats: {
    overview: ["stats", "overview"] as const,
    occupancy: (weeks: number) => ["stats", "occupancy", weeks] as const,
    revenue: (from: string, to: string) => ["stats", "revenue", from, to] as const,
  },
  payments: {
    health: ["payments", "health"] as const,
    moneyIn: ["payments", "money-in"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  players: {
    all: ["players"] as const,
    list: (search: string) => ["players", "list", search] as const,
    detail: (id: string) => ["players", "detail", id] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    list: ["conversations", "list"] as const,
    messages: (id: string) => ["conversations", "messages", id] as const,
  },
  products: {
    all: ["products"] as const,
    list: ["products", "list"] as const,
  },
  onboarding: {
    status: ["onboarding", "status"] as const,
  },
  ops: {
    leads: (status?: string) => ["ops", "leads", status ?? "all"] as const,
    leadsSummary: ["ops", "leads", "summary"] as const,
    clubs: ["ops", "clubs"] as const,
    clubUsers: (clubId: string) => ["ops", "clubs", clubId, "users"] as const,
    business: ["ops", "metrics", "business"] as const,
    bot: ["ops", "metrics", "bot"] as const,
    health: ["ops", "health"] as const,
  },
} as const;
