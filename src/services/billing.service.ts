import { apiClient } from "@/lib/api/client";
import type { BillingOverview } from "@/types/api/billing";

export const billingService = {
  getOverview(): Promise<BillingOverview> {
    return apiClient.get<BillingOverview>("/api/billing");
  },
};
