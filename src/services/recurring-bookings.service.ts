import { apiClient } from "@/lib/api/client";
import type {
  ApplyRecurringBookingResult,
  CreateRecurringBookingRequest,
  RecurringBooking,
  UpdateRecurringBookingRequest,
} from "@/types/api/recurring";

export const recurringBookingsService = {
  list(): Promise<RecurringBooking[]> {
    return apiClient.get<RecurringBooking[]>("/api/recurring-bookings");
  },
  create(body: CreateRecurringBookingRequest): Promise<RecurringBooking> {
    return apiClient.post<RecurringBooking>("/api/recurring-bookings", body);
  },
  update(id: string, body: UpdateRecurringBookingRequest): Promise<RecurringBooking> {
    return apiClient.patch<RecurringBooking>(`/api/recurring-bookings/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/api/recurring-bookings/${id}`);
  },
  apply(id: string): Promise<ApplyRecurringBookingResult> {
    return apiClient.post<ApplyRecurringBookingResult>(
      `/api/recurring-bookings/${id}/apply`,
    );
  },
};
