"use client";

import { useQuery } from "@tanstack/react-query";
import { statsService } from "@/services/stats.service";
import { queryKeys } from "@/lib/query-keys";
import type { OverviewStats } from "@/types/api/stats";

export function useOverviewStats() {
  return useQuery<OverviewStats>({
    queryKey: queryKeys.stats.overview,
    queryFn: () => statsService.getOverview(),
  });
}
