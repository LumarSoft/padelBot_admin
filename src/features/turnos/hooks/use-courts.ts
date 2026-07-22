"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { courtsService } from "@/services/courts.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { Court, CreateCourtRequest, UpdateCourtRequest } from "@/types/api/turnos";

export function useCourts() {
  return useQuery<Court[]>({
    queryKey: queryKeys.courts.all,
    queryFn: () => courtsService.list(),
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();

  return useMutation<Court, ApiError, CreateCourtRequest>({
    mutationFn: (body) => courtsService.create(body),
    onSuccess: (court) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courts.all });
      // Keep the setup wizard's aggregated status (and its counts) in sync.
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success(`Cancha "${court.name}" creada`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();

  return useMutation<Court, ApiError, { id: string; body: UpdateCourtRequest }>({
    mutationFn: ({ id, body }) => courtsService.update(id, body),
    onSuccess: (court) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courts.all });
      toast.success(`Cancha renombrada a "${court.name}"`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCourt() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => courtsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success("Cancha eliminada");
    },
    onError: (error) => toast.error(error.message),
  });
}
