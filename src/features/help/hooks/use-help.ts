"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { helpService } from "@/services/help.service";
import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/api-error";
import type {
  FirstDayStatus,
  HouseRule,
  TeamMemberFirstDay,
  UpdateHouseRulesRequest,
} from "@/types/api/help";

/** The caller's "Tu primer día" checklist. */
export function useFirstDay(enabled = true) {
  return useQuery<FirstDayStatus>({
    queryKey: queryKeys.help.firstDay,
    queryFn: () => helpService.getFirstDay(),
    enabled,
  });
}

export function useDismissFirstDay() {
  const queryClient = useQueryClient();
  return useMutation<{ dismissedAt: string }, ApiError, void>({
    mutationFn: () => helpService.dismissFirstDay(),
    onSuccess: ({ dismissedAt }) => {
      queryClient.setQueryData<FirstDayStatus>(queryKeys.help.firstDay, (prev) =>
        prev ? { ...prev, dismissedAt } : prev,
      );
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Every employee's progress, for the owner's team table. */
export function useTeamFirstDay(enabled = true) {
  return useQuery<TeamMemberFirstDay[]>({
    queryKey: queryKeys.help.team,
    queryFn: () => helpService.getTeamFirstDay(),
    enabled,
  });
}

export function useHouseRules() {
  return useQuery<HouseRule[]>({
    queryKey: queryKeys.help.houseRules,
    queryFn: () => helpService.getHouseRules(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateHouseRules() {
  const queryClient = useQueryClient();
  return useMutation<HouseRule[], ApiError, UpdateHouseRulesRequest>({
    mutationFn: (body) => helpService.updateHouseRules(body),
    onSuccess: (rules) => {
      queryClient.setQueryData(queryKeys.help.houseRules, rules);
      toast.success("Reglas de la casa guardadas");
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Logs a search that found nothing. Silent on failure: it's for us, not for the person. */
export function useRecordSearchMiss() {
  return useMutation<{ recorded: boolean }, ApiError, string>({
    mutationFn: (query) => helpService.recordSearchMiss(query),
  });
}
