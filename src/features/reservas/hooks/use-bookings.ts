"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { productsService } from "@/services/products.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  Booking,
  BookingFilters,
  CreateBookingRequest,
  RescheduleBookingRequest,
} from "@/types/api/bookings";
import type { SetBookingProductsRequest } from "@/types/api/products";

export function useBookings(
  filters: BookingFilters = {},
  options: { refetchInterval?: number } = {},
) {
  return useQuery<Booking[]>({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () => bookingsService.list(filters),
    refetchInterval: options.refetchInterval,
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

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation<{ noShowAt: string }, ApiError, string>({
    mutationFn: (id) => bookingsService.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      toast.success("Marcado como ausente");
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

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation<{ confirmed: boolean }, ApiError, string>({
    mutationFn: (id) => bookingsService.confirmPayment(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(
        result.confirmed ? "Pago confirmado y reserva asegurada" : "La reserva ya no estaba pendiente",
      );
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation<{ cancelled: boolean }, ApiError, string>({
    mutationFn: (id) => bookingsService.rejectPayment(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(
        result.cancelled ? "Pago rechazado y turno liberado" : "La reserva ya no estaba pendiente",
      );
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSetBookingProducts() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, { bookingId: string; body: SetBookingProductsRequest }>({
    mutationFn: ({ bookingId, body }) => productsService.setBookingProducts(bookingId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success("Consumos guardados");
    },
    onError: (error) => toast.error(error.message),
  });
}
