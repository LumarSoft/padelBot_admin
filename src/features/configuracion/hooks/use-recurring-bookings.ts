"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recurringBookingsService } from "@/services/recurring-bookings.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  CreateRecurringBookingRequest,
  RecurringBooking,
  UpdateRecurringBookingRequest,
} from "@/types/api/recurring";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.recurringBookings.all });
  // Applying / editing a fixed slot can materialize bookings on real slots.
  queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
}

export function useRecurringBookings() {
  return useQuery<RecurringBooking[]>({
    queryKey: queryKeys.recurringBookings.all,
    queryFn: () => recurringBookingsService.list(),
  });
}

export function useCreateRecurringBooking() {
  const queryClient = useQueryClient();

  return useMutation<RecurringBooking, ApiError, CreateRecurringBookingRequest>({
    mutationFn: (body) => recurringBookingsService.create(body),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Turno fijo creado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateRecurringBooking() {
  const queryClient = useQueryClient();

  return useMutation<
    RecurringBooking,
    ApiError,
    { id: string; body: UpdateRecurringBookingRequest }
  >({
    mutationFn: ({ id, body }) => recurringBookingsService.update(id, body),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Turno fijo actualizado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteRecurringBooking() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => recurringBookingsService.remove(id),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Turno fijo eliminado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useApplyRecurringBooking() {
  const queryClient = useQueryClient();

  return useMutation<{ applied: number }, ApiError, string>({
    mutationFn: (id) => recurringBookingsService.apply(id),
    onSuccess: (result) => {
      invalidateAll(queryClient);
      toast.success(
        result.applied > 0
          ? `Aplicado a ${result.applied} turno${result.applied === 1 ? "" : "s"}`
          : "No había turnos disponibles para aplicar",
      );
    },
    onError: (error) => toast.error(error.message),
  });
}
