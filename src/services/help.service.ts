import { apiClient } from "@/lib/api/client";
import type {
  FirstDayStatus,
  HouseRule,
  TeamMemberFirstDay,
  UpdateHouseRulesRequest,
} from "@/types/api/help";

export const helpService = {
  getFirstDay(): Promise<FirstDayStatus> {
    return apiClient.get<FirstDayStatus>("/api/help/first-day");
  },
  dismissFirstDay(): Promise<{ dismissedAt: string }> {
    return apiClient.post<{ dismissedAt: string }>("/api/help/first-day/dismiss");
  },
  getTeamFirstDay(): Promise<TeamMemberFirstDay[]> {
    return apiClient.get<TeamMemberFirstDay[]>("/api/help/first-day/team");
  },
  getHouseRules(): Promise<HouseRule[]> {
    return apiClient.get<HouseRule[]>("/api/help/house-rules");
  },
  updateHouseRules(body: UpdateHouseRulesRequest): Promise<HouseRule[]> {
    return apiClient.patch<HouseRule[]>("/api/help/house-rules", body);
  },
  recordSearchMiss(query: string): Promise<{ recorded: boolean }> {
    return apiClient.post<{ recorded: boolean }>("/api/help/search-misses", { query });
  },
};
