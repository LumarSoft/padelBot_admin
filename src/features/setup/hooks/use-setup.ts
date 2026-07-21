"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onboardingService } from "@/services/onboarding.service";
import { clubsService } from "@/services/clubs.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  CreateWhatsAppLineRequest,
  SaveSetupProgressRequest,
  SetupProgress,
  SetupStatus,
} from "@/types/api/onboarding";
import type { WhatsAppLine } from "@/types/api/clubs";

/**
 * Aggregated setup state. Replaces the four separate queries the old checklist fired,
 * and is the single source of truth for which steps are done.
 */
export function useSetupStatus() {
  return useQuery<SetupStatus>({
    queryKey: queryKeys.onboarding.status,
    queryFn: () => onboardingService.getStatus(),
  });
}

/**
 * Persists the wizard position. Fire-and-forget by design: losing a position write is
 * harmless (the step's real data is already saved), so it must never interrupt the owner
 * with an error toast mid-setup.
 */
export function useSaveSetupProgress() {
  return useMutation<SetupProgress, ApiError, SaveSetupProgressRequest>({
    mutationFn: (body) => onboardingService.saveProgress(body),
  });
}

export function useCompleteSetup() {
  const queryClient = useQueryClient();

  return useMutation<{ setupCompletedAt: string }, ApiError, void>({
    mutationFn: () => onboardingService.complete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useWhatsAppLines() {
  return useQuery<WhatsAppLine[]>({
    queryKey: queryKeys.clubs.whatsappLines,
    queryFn: () => clubsService.getWhatsAppLines(),
  });
}

export function useCreateWhatsAppLine() {
  const queryClient = useQueryClient();

  return useMutation<WhatsAppLine, ApiError, CreateWhatsAppLineRequest>({
    mutationFn: (body) => clubsService.createWhatsAppLine(body),
    onSuccess: (line) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.whatsappLines });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success(`Línea ${line.displayPhone} conectada`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteWhatsAppLine() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => clubsService.deleteWhatsAppLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.whatsappLines });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success("Línea desconectada");
    },
    onError: (error) => toast.error(error.message),
  });
}
