import { apiClient } from "@/lib/api/client";
import type {
  BillingOverview,
  BuyCreditPackResponse,
  CreditPackPurchase,
} from "@/types/api/billing";

export const billingService = {
  getOverview(): Promise<BillingOverview> {
    return apiClient.get<BillingOverview>("/api/billing");
  },
  buyPack(packKey: string): Promise<BuyCreditPackResponse> {
    return apiClient.post<BuyCreditPackResponse>("/api/billing/credit-packs", { packKey });
  },
  confirmPurchase(purchaseId: string, paymentId: string): Promise<CreditPackPurchase> {
    return apiClient.post<CreditPackPurchase>(
      `/api/billing/credit-packs/${encodeURIComponent(purchaseId)}/confirm`,
      { paymentId },
    );
  },
};
