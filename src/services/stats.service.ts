import { apiClient } from "@/lib/api/client";
import type { OccupancyReport, OverviewStats, RevenueReport } from "@/types/api/stats";

export const statsService = {
  getOverview(): Promise<OverviewStats> {
    return apiClient.get<OverviewStats>("/api/stats/overview");
  },
  getOccupancy(weeks = 4): Promise<OccupancyReport> {
    return apiClient.get<OccupancyReport>(`/api/stats/occupancy?weeks=${weeks}`);
  },
  getRevenue(from?: string, to?: string): Promise<RevenueReport> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return apiClient.get<RevenueReport>(`/api/stats/revenue${qs ? `?${qs}` : ""}`);
  },
};
