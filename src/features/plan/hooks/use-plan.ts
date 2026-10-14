"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { clubsService } from "@/services/clubs.service";
import type { ClubPlanOverview, PlanUsage } from "@/types/api/clubs";

/** The club's plan, its limits and usage. Refreshed when something it counts is created. */
export function usePlan() {
  return useQuery<ClubPlanOverview>({
    queryKey: queryKeys.clubs.plan,
    queryFn: clubsService.getPlan,
    staleTime: 60_000,
  });
}

/** Whether the plan has room for one more (true while loading: the API has the last word). */
export function hasRoom(usage: PlanUsage | undefined): boolean {
  return !usage || usage.limit === null || usage.used < usage.limit;
}
