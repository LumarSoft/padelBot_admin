"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitionsService } from "@/services/competitions.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
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

type QueryClient = ReturnType<typeof useQueryClient>;

function invalidateCompetitions(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
}

/** Courts or sessions changed: the agenda's blocked turnos changed with them. */
function invalidateCourts(queryClient: QueryClient) {
  invalidateCompetitions(queryClient);
  queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
}

export function useCompetitions(filters: CompetitionFilters) {
  return useQuery<CompetitionSummary[]>({
    queryKey: queryKeys.competitions.list(filters),
    queryFn: () => competitionsService.list(filters),
  });
}

export function useCompetition(id: string) {
  return useQuery<CompetitionDetail>({
    queryKey: queryKeys.competitions.detail(id),
    queryFn: () => competitionsService.get(id),
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation<CompetitionDetail, ApiError, CreateCompetitionRequest>({
    mutationFn: (body) => competitionsService.create(body),
    onSuccess: (created) => {
      invalidateCourts(queryClient);
      toast.success(created.kind === "PENA" ? "Peña creada" : "Torneo creado", {
        description: "Sus canchas ya quedaron bloqueadas en la agenda.",
      });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCompetition(id: string) {
  const queryClient = useQueryClient();
  return useMutation<CompetitionDetail, ApiError, UpdateCompetitionRequest>({
    mutationFn: (body) => competitionsService.update(id, body),
    onSuccess: (_, body) => {
      if (body.courtIds || body.sessions) invalidateCourts(queryClient);
      else invalidateCompetitions(queryClient);
      toast.success("Cambios guardados");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCancelCompetition(id: string) {
  const queryClient = useQueryClient();
  return useMutation<CompetitionDetail, ApiError, void>({
    mutationFn: () => competitionsService.cancel(id),
    onSuccess: () => {
      invalidateCourts(queryClient);
      toast.success("Evento cancelado", { description: "Sus turnos volvieron a estar libres." });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCompetition(id: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => competitionsService.remove(id),
    onSuccess: () => {
      invalidateCourts(queryClient);
      toast.success("Evento eliminado");
    },
    onError: (error) => toast.error(error.message),
  });
}

/** A write on the event's insides (pairs, fixture, results): it only refreshes the event. */
function useDetailMutation<V>(
  run: (variables: V) => Promise<CompetitionDetail>,
  successMessage: string | ((variables: V) => string),
) {
  const queryClient = useQueryClient();
  return useMutation<CompetitionDetail, ApiError, V>({
    mutationFn: run,
    onSuccess: (detail, variables) => {
      queryClient.setQueryData(queryKeys.competitions.detail(detail.id), detail);
      invalidateCompetitions(queryClient);
      toast.success(typeof successMessage === "function" ? successMessage(variables) : successMessage);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useAddCategory(id: string) {
  return useDetailMutation((body: CategoryInput) => competitionsService.addCategory(id, body), "Categoría agregada");
}

export function useRemoveCategory(id: string) {
  return useDetailMutation(
    (categoryId: string) => competitionsService.removeCategory(id, categoryId),
    "Categoría eliminada",
  );
}

export function useAddPair(id: string) {
  return useDetailMutation((body: CreatePairRequest) => competitionsService.addPair(id, body), "Pareja anotada");
}

export function useUpdatePair(id: string) {
  return useDetailMutation(
    ({ pairId, body }: { pairId: string; body: UpdatePairRequest }) =>
      competitionsService.updatePair(id, pairId, body),
    "Pareja actualizada",
  );
}

export function useRemovePair(id: string) {
  return useDetailMutation((pairId: string) => competitionsService.removePair(id, pairId), "Pareja eliminada");
}

export function useSetPlayerPayment(id: string) {
  return useDetailMutation(
    ({ playerId, body }: { playerId: string; body: UpdatePlayerPaymentRequest }) =>
      competitionsService.setPayment(id, playerId, body),
    ({ body }) => (body.paid ? "Pago registrado" : "Pago marcado como pendiente"),
  );
}

export function useGenerateFixture(id: string) {
  return useDetailMutation(
    (categoryId: string) => competitionsService.generateFixture(id, categoryId),
    "Fixture armado",
  );
}

export function useDeleteFixture(id: string) {
  return useDetailMutation(
    (categoryId: string) => competitionsService.deleteFixture(id, categoryId),
    "Fixture borrado",
  );
}

export function useGenerateBracket(id: string) {
  return useDetailMutation(
    (categoryId: string) => competitionsService.generateBracket(id, categoryId),
    "Cuadro armado",
  );
}

export function useDeleteBracket(id: string) {
  return useDetailMutation(
    (categoryId: string) => competitionsService.deleteBracket(id, categoryId),
    "Cuadro borrado",
  );
}

export function useUpdateMatch(id: string) {
  return useDetailMutation(
    ({ matchId, body }: { matchId: string; body: UpdateMatchRequest }) =>
      competitionsService.updateMatch(id, matchId, body),
    ({ body }) => (body.sets === null ? "Resultado borrado" : "Partido actualizado"),
  );
}
