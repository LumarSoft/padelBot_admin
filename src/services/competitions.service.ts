import { apiClient } from "@/lib/api/client";
import type {
  CategoryInput,
  CompetitionDetail,
  CompetitionFilters,
  CompetitionSummary,
  CreateCompetitionRequest,
  CreatePairRequest,
  UpdateCompetitionRequest,
  UpdateMatchRequest,
  UpdatePairRequest,
  UpdatePlayerPaymentRequest,
} from "@/types/api/competitions";

const base = (id: string) => `/api/competitions/${id}`;

export const competitionsService = {
  list(filters: CompetitionFilters = {}): Promise<CompetitionSummary[]> {
    const params = new URLSearchParams();
    if (filters.kind) params.set("kind", filters.kind);
    if (filters.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiClient.get<CompetitionSummary[]>(`/api/competitions${qs ? `?${qs}` : ""}`);
  },
  get(id: string): Promise<CompetitionDetail> {
    return apiClient.get<CompetitionDetail>(base(id));
  },
  create(body: CreateCompetitionRequest): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>("/api/competitions", body);
  },
  update(id: string, body: UpdateCompetitionRequest): Promise<CompetitionDetail> {
    return apiClient.patch<CompetitionDetail>(base(id), body);
  },
  cancel(id: string): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>(`${base(id)}/cancel`);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(base(id));
  },
  addCategory(id: string, body: CategoryInput): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>(`${base(id)}/categories`, body);
  },
  updateCategory(id: string, categoryId: string, body: Partial<CategoryInput>): Promise<CompetitionDetail> {
    return apiClient.patch<CompetitionDetail>(`${base(id)}/categories/${categoryId}`, body);
  },
  removeCategory(id: string, categoryId: string): Promise<CompetitionDetail> {
    return apiClient.del<CompetitionDetail>(`${base(id)}/categories/${categoryId}`);
  },
  generateFixture(id: string, categoryId: string): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>(`${base(id)}/categories/${categoryId}/fixture`);
  },
  deleteFixture(id: string, categoryId: string): Promise<CompetitionDetail> {
    return apiClient.del<CompetitionDetail>(`${base(id)}/categories/${categoryId}/fixture`);
  },
  generateBracket(id: string, categoryId: string): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>(`${base(id)}/categories/${categoryId}/bracket`);
  },
  deleteBracket(id: string, categoryId: string): Promise<CompetitionDetail> {
    return apiClient.del<CompetitionDetail>(`${base(id)}/categories/${categoryId}/bracket`);
  },
  addPair(id: string, body: CreatePairRequest): Promise<CompetitionDetail> {
    return apiClient.post<CompetitionDetail>(`${base(id)}/pairs`, body);
  },
  updatePair(id: string, pairId: string, body: UpdatePairRequest): Promise<CompetitionDetail> {
    return apiClient.patch<CompetitionDetail>(`${base(id)}/pairs/${pairId}`, body);
  },
  removePair(id: string, pairId: string): Promise<CompetitionDetail> {
    return apiClient.del<CompetitionDetail>(`${base(id)}/pairs/${pairId}`);
  },
  setPayment(id: string, playerId: string, body: UpdatePlayerPaymentRequest): Promise<CompetitionDetail> {
    return apiClient.patch<CompetitionDetail>(`${base(id)}/players/${playerId}/payment`, body);
  },
  updateMatch(id: string, matchId: string, body: UpdateMatchRequest): Promise<CompetitionDetail> {
    return apiClient.patch<CompetitionDetail>(`${base(id)}/matches/${matchId}`, body);
  },
};
