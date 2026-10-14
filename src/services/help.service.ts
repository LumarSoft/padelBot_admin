import { apiClient } from "@/lib/api/client";
import type {
  FirstDayStatus,
  HouseRule,
  NewsSeen,
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
  getNewsSeen(): Promise<NewsSeen> {
    return apiClient.get<NewsSeen>("/api/help/news/seen");
  },
  markNewsSeen(newsId: string): Promise<{ seenId: string }> {
    return apiClient.post<{ seenId: string }>("/api/help/news/seen", { newsId });
  },
  recordSearchMiss(query: string): Promise<{ recorded: boolean }> {
    return apiClient.post<{ recorded: boolean }>("/api/help/search-misses", { query });
  },
};
