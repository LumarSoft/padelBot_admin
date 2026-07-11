import { apiClient } from "@/lib/api/client";
import type {
  SaveSetupProgressRequest,
  SetupProgress,
  SetupStatus,
} from "@/types/api/onboarding";

export const onboardingService = {
  getStatus(): Promise<SetupStatus> {
    return apiClient.get<SetupStatus>("/api/onboarding/status");
  },
  saveProgress(body: SaveSetupProgressRequest): Promise<SetupProgress> {
    return apiClient.patch<SetupProgress>("/api/onboarding/progress", body);
  },
  complete(): Promise<{ setupCompletedAt: string }> {
    return apiClient.post<{ setupCompletedAt: string }>("/api/onboarding/complete");
  },
};
