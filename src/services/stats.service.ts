import { apiClient } from "@/lib/api/client";
import type { OverviewStats } from "@/types/api/stats";

export const statsService = {
  getOverview(): Promise<OverviewStats> {
    return apiClient.get<OverviewStats>("/api/stats/overview");
  },
};
