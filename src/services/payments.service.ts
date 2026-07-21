import { apiClient } from "@/lib/api/client";
import type { MoneyInDiagnostics, PaymentsHealth } from "@/types/api/payments";

export const paymentsService = {
  getHealth(): Promise<PaymentsHealth> {
    return apiClient.get<PaymentsHealth>("/api/payments/health");
  },
  getMoneyIn(minutes = 1440): Promise<MoneyInDiagnostics> {
    return apiClient.get<MoneyInDiagnostics>(`/api/payments/money-in?minutes=${minutes}`);
  },
};
