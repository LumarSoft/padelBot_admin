"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slotsService } from "@/services/slots.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  BulkBlockResult,
  BulkBlockSlotsRequest,
  CreateSlotRequest,
  Slot,
  SlotFilters,
  UpdateSlotRequest,
} from "@/types/api/turnos";

export function useSlots(filters: SlotFilters = {}) {
  return useQuery<Slot[]>({
    queryKey: queryKeys.slots.list(filters),
    queryFn: () => slotsService.list(filters),
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation<Slot, ApiError, CreateSlotRequest>({
    mutationFn: (body) => slotsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success("Turno creado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();

  return useMutation<Slot, ApiError, { id: string; body: UpdateSlotRequest }>({
    mutationFn: ({ id, body }) => slotsService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useBulkBlockSlots() {
  const queryClient = useQueryClient();

  return useMutation<BulkBlockResult, ApiError, BulkBlockSlotsRequest>({
    mutationFn: (body) => slotsService.bulkBlock(body),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      const parts = [`${result.blocked} bloqueado${result.blocked === 1 ? "" : "s"}`];
      if (result.skipped > 0) {
        parts.push(`${result.skipped} omitido${result.skipped === 1 ? "" : "s"} (reservados o ya bloqueados)`);
      }
      toast.success(parts.join(" · "));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => slotsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      toast.success("Turno eliminado");
    },
    onError: (error) => toast.error(error.message),
  });
}
