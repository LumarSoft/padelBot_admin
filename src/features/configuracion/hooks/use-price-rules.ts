"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { priceRulesService } from "@/services/price-rules.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  CreatePriceRuleRequest,
  PriceRule,
  UpdatePriceRuleRequest,
} from "@/types/api/turnos";

export function usePriceRules(courtId: string, enabled = true) {
  return useQuery<PriceRule[]>({
    queryKey: queryKeys.priceRules.byCourt(courtId),
    queryFn: () => priceRulesService.list(courtId),
    enabled: enabled && !!courtId,
  });
}

export function useCreatePriceRule(courtId: string) {
  const queryClient = useQueryClient();
  return useMutation<PriceRule, ApiError, CreatePriceRuleRequest>({
    mutationFn: (body) => priceRulesService.create(courtId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priceRules.byCourt(courtId) });
      toast.success("Excepción de precio agregada");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdatePriceRule(courtId: string) {
  const queryClient = useQueryClient();
  return useMutation<PriceRule, ApiError, { id: string; body: UpdatePriceRuleRequest }>({
    mutationFn: ({ id, body }) => priceRulesService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priceRules.byCourt(courtId) });
      toast.success("Precio actualizado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeletePriceRule(courtId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => priceRulesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priceRules.byCourt(courtId) });
      toast.success("Excepción eliminada");
    },
    onError: (error) => toast.error(error.message),
  });
}
