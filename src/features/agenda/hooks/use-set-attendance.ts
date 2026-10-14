"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { Booking } from "@/types/api/bookings";

/**
 * The front desk records a fijo's answer after calling them. `confirmed: false` releases only
 * that date (the fijo keeps the next weeks) and the waitlist gets the court.
 */
export function useSetAttendance() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, { id: string; confirmed: boolean }>({
    mutationFn: ({ id, confirmed }) => bookingsService.setAttendance(id, confirmed),
    onSuccess: (booking, { confirmed }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success(
        confirmed
          ? `${booking.playerName} viene ✓`
          : `Liberaste el turno de ${booking.playerName}. Las próximas semanas sigue igual.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });
}
