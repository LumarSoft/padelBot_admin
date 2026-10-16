"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitionSignupsService } from "@/services/competition-signups.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  CompetitionSignupRequest,
  SignupRequestFilters,
  SignupRequestStatus,
} from "@/types/api/competition-signups";

/** Sign-up requests from the WhatsApp bot. SSE refreshes them; the poll is the safety net. */
export function useSignupRequests(filters: SignupRequestFilters) {
  return useQuery<CompetitionSignupRequest[]>({
    queryKey: queryKeys.competitions.signups(filters),
    queryFn: () => competitionSignupsService.list(filters),
    refetchInterval: 60_000,
  });
}

const STATUS_TOAST: Record<SignupRequestStatus, string> = {
  HANDLED: "Marcada como atendida",
  DISMISSED: "Solicitud descartada",
  PENDING: "Vuelve a estar pendiente",
};

export function useSetSignupRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation<CompetitionSignupRequest, ApiError, { id: string; status: SignupRequestStatus }>({
    mutationFn: ({ id, status }) => competitionSignupsService.setStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      toast.success(STATUS_TOAST[status]);
    },
    onError: (error) => toast.error(error.message),
  });
}
