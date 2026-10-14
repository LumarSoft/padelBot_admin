"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { helpService } from "@/services/help.service";
import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/api-error";
import type {
  FirstDayStatus,
  HouseRule,
  NewsSeen,
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

/** The newest "Novedades" entry the user has seen — drives the dot on the "?". */
export function useNewsSeen(enabled = true) {
  return useQuery<NewsSeen>({
    queryKey: queryKeys.help.newsSeen,
    queryFn: () => helpService.getNewsSeen(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Marks the news as seen up to `newsId`. Optimistic: the dot goes away on open, not after a round trip. */
export function useMarkNewsSeen() {
  const queryClient = useQueryClient();
  return useMutation<{ seenId: string }, ApiError, string, { previous?: NewsSeen }>({
    mutationFn: (newsId) => helpService.markNewsSeen(newsId),
    onMutate: (newsId) => {
      const previous = queryClient.getQueryData<NewsSeen>(queryKeys.help.newsSeen);
      queryClient.setQueryData<NewsSeen>(queryKeys.help.newsSeen, { seenId: newsId });
      return { previous };
    },
    // Silent: the worst case is the dot showing up again next time.
    onError: (_error, _newsId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.help.newsSeen, context.previous);
    },
  });
}
