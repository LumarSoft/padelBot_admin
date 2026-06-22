import { apiClient } from "@/lib/api/client";
import type {
  Booking,
  BookingFilters,
  CreateBookingRequest,
  RescheduleBookingRequest,
} from "@/types/api/bookings";

function buildQuery(filters: BookingFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.courtId) params.set("courtId", filters.courtId);
  if (filters.status) params.set("status", filters.status);
  if (filters.playerPhone) params.set("playerPhone", filters.playerPhone);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const bookingsService = {
  list(filters: BookingFilters = {}): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/api/bookings${buildQuery(filters)}`);
  },
  create(body: CreateBookingRequest): Promise<Booking> {
    return apiClient.post<Booking>("/api/bookings", body);
  },
  cancel(id: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/cancel`);
  },
  reschedule(id: string, body: RescheduleBookingRequest): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/reschedule`, body);
  },
  confirmPayment(id: string): Promise<{ confirmed: boolean }> {
    return apiClient.patch<{ confirmed: boolean }>(`/api/bookings/${id}/confirm-payment`);
  },
  rejectPayment(id: string): Promise<{ cancelled: boolean }> {
    return apiClient.patch<{ cancelled: boolean }>(`/api/bookings/${id}/reject-payment`);
  },
};
