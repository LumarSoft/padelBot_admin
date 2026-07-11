import { apiClient } from "@/lib/api/client";
import type {
  BookingAccountView,
  AddPlayerPaymentRequest,
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
  if (filters.search) params.set("search", filters.search);
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
  markNoShow(id: string): Promise<{ noShowAt: string }> {
    return apiClient.post<{ noShowAt: string }>(`/api/bookings/${id}/no-show`);
  },
  getAccount(id: string): Promise<BookingAccountView> {
    return apiClient.get<BookingAccountView>(`/api/bookings/${id}/account`);
  },
  addPlayerPayment(id: string, body: AddPlayerPaymentRequest): Promise<BookingAccountView> {
    return apiClient.post<BookingAccountView>(`/api/bookings/${id}/payments`, body);
  },
  removePlayerPayment(id: string, paymentId: string): Promise<BookingAccountView> {
    return apiClient.del<BookingAccountView>(`/api/bookings/${id}/payments/${paymentId}`);
  },
  setLocalPayment(
    id: string,
    body: { method: "CASH" | "QR"; amountCents: number },
  ): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/local-payment`, body);
  },
  reschedule(id: string, body: RescheduleBookingRequest): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/reschedule`, body);
  },
  confirmPayment(
    id: string,
    assign?: { paymentRef: string; payerCuit?: string; payerEmail?: string; payerMpUserId?: string },
  ): Promise<{ confirmed: boolean }> {
    return apiClient.patch<{ confirmed: boolean }>(`/api/bookings/${id}/confirm-payment`, assign);
  },
  rejectPayment(id: string): Promise<{ cancelled: boolean }> {
    return apiClient.patch<{ cancelled: boolean }>(`/api/bookings/${id}/reject-payment`);
  },
};
