import { apiClient } from "@/lib/api/client";
import type {
  CreateImprovementSuggestionRequest,
  Improvement,
  ImprovementSuggestion,
} from "@/types/api/improvements";

/** "Mejoras": what Lumarsoft published and the club's suggestions to us. */
export const improvementsService = {
  listPublished(): Promise<Improvement[]> {
    return apiClient.get<Improvement[]>("/api/improvements");
  },
  listSuggestions(): Promise<ImprovementSuggestion[]> {
    return apiClient.get<ImprovementSuggestion[]>("/api/improvements/suggestions");
  },
  createSuggestion(body: CreateImprovementSuggestionRequest): Promise<ImprovementSuggestion> {
    return apiClient.post<ImprovementSuggestion>("/api/improvements/suggestions", body);
  },
};
