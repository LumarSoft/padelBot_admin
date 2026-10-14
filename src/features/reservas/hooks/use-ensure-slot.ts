"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slotsService } from "@/services/slots.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { SlotOption } from "@/features/reservas/lib/slot-options";

/**
 * Resolves a picked `SlotOption` to a Slot id, creating the Slot when its band was never
 * materialized — what the Agenda's reserve form does before booking a never-used cell.
 * If the Slot appeared meanwhile (the bot or another tab got there first, or a retry after a
 * failed reschedule), the create 409s and the existing one is reused while it's still free.
 */
export function useEnsureSlot() {
  const queryClient = useQueryClient();

  return useMutation<string, ApiError, SlotOption>({
    mutationFn: async (option) => {
      if (option.slotId) return option.slotId;
      const { courtId, startsAt, endsAt, priceCents } = option;
      try {
        const created = await slotsService.create({ courtId, startsAt, endsAt, priceCents });
        return created.id;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
        const [existing] = await slotsService.list({ courtId, from: startsAt, to: startsAt });
        if (existing?.status !== "AVAILABLE") {
          throw new ApiError(409, "Ese turno se acaba de ocupar. Elegí otro.");
        }
        return existing.id;
      }
    },
    onSettled: (_id, _error, option) => {
      if (!option.slotId) queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "No se pudo preparar el turno"),
  });
}
