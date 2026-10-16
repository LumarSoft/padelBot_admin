"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { improvementsService } from "@/services/improvements.service";
import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/api-error";
import type {
  CreateImprovementSuggestionRequest,
  Improvement,
  ImprovementSuggestion,
} from "@/types/api/improvements";

/** What Lumarsoft published, newest first. */
export function usePublishedImprovements() {
  return useQuery<Improvement[]>({
    queryKey: queryKeys.improvements.published,
    queryFn: () => improvementsService.listPublished(),
    staleTime: 5 * 60_000,
  });
}

/** The club's own suggestions, with our answer. */
export function useImprovementSuggestions() {
  return useQuery<ImprovementSuggestion[]>({
    queryKey: queryKeys.improvements.suggestions,
    queryFn: () => improvementsService.listSuggestions(),
  });
}

export function useCreateImprovementSuggestion() {
  const queryClient = useQueryClient();
  return useMutation<ImprovementSuggestion, ApiError, CreateImprovementSuggestionRequest>({
    mutationFn: (body) => improvementsService.createSuggestion(body),
    onSuccess: (created) => {
      queryClient.setQueryData<ImprovementSuggestion[]>(
        queryKeys.improvements.suggestions,
        (prev) => [created, ...(prev ?? [])],
      );
      toast.success("¡Gracias! Nos llegó tu propuesta.");
    },
    onError: (error) => toast.error(error.message),
  });
}
