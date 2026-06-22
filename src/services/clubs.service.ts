import { apiClient } from "@/lib/api/client";
import type { TransferConfig, UpdateTransferConfigRequest } from "@/types/api/clubs";

export const clubsService = {
  getTransferConfig(): Promise<TransferConfig> {
    return apiClient.get<TransferConfig>("/api/clubs/transfer-config");
  },
  updateTransferConfig(body: UpdateTransferConfigRequest): Promise<TransferConfig> {
    return apiClient.patch<TransferConfig>("/api/clubs/transfer-config", body);
  },
};
