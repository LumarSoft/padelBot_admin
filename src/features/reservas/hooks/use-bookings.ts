"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  Booking,
  BookingFilters,
  CreateBookingRequest,
  RescheduleBookingRequest,
} from "@/types/api/bookings";

export function useBookings(filters: BookingFilters = {}) {
  return useQuery<Booking[]>({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () => bookingsService.list(filters),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, CreateBookingRequest>({
    mutationFn: (body) => bookingsService.create(body),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(`Reserva creada para ${booking.playerName}`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, string>({
    mutationFn: (id) => bookingsService.cancel(id),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(`Reserva de ${booking.playerName} cancelada`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, { id: string; body: RescheduleBookingRequest }>({
    mutationFn: ({ id, body }) => bookingsService.reschedule(id, body),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(`Reserva de ${booking.playerName} reprogramada`);
    },
    onError: (error) => toast.error(error.message),
  });
}
