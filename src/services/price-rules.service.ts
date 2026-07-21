import { apiClient } from "@/lib/api/client";
import type {
  CreatePriceRuleRequest,
  PriceRule,
  UpdatePriceRuleRequest,
} from "@/types/api/turnos";

export const priceRulesService = {
  list(courtId: string): Promise<PriceRule[]> {
    return apiClient.get<PriceRule[]>(`/api/courts/${courtId}/price-rules`);
  },
  create(courtId: string, body: CreatePriceRuleRequest): Promise<PriceRule> {
    return apiClient.post<PriceRule>(`/api/courts/${courtId}/price-rules`, body);
  },
  update(id: string, body: UpdatePriceRuleRequest): Promise<PriceRule> {
    return apiClient.patch<PriceRule>(`/api/price-rules/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/api/price-rules/${id}`);
  },
};
