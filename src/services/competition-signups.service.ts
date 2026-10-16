import { apiClient } from "@/lib/api/client";
import type {
  CompetitionSignupRequest,
  SignupRequestFilters,
  SignupRequestStatus,
} from "@/types/api/competition-signups";

export const competitionSignupsService = {
  list(filters: SignupRequestFilters = {}): Promise<CompetitionSignupRequest[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.competitionId) params.set("competitionId", filters.competitionId);
    const qs = params.toString();
    return apiClient.get<CompetitionSignupRequest[]>(`/api/competition-signup-requests${qs ? `?${qs}` : ""}`);
  },
  setStatus(id: string, status: SignupRequestStatus): Promise<CompetitionSignupRequest> {
    return apiClient.patch<CompetitionSignupRequest>(`/api/competition-signup-requests/${id}`, { status });
  },
};
