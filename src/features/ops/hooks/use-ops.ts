"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { opsService } from "@/services/ops.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  BotMetrics,
  BusinessMetrics,
  ProfitabilityReport,
  ClubUser,
  Lead,
  LeadStatus,
  LeadsSummary,
  OpsClub,
  OpsClubDetail,
  OpsHealth,
  SignupFunnel,
  ProvisionLeadPayload,
  UpdateLeadPayload,
  UpdateSubscriptionPayload,
} from "@/types/api/ops";
import type { HelpSearchMiss } from "@/types/api/help";
import type {
  OpsImprovement,
  OpsImprovementSuggestion,
  SaveImprovementPayload,
  UpdateImprovementSuggestionPayload,
} from "@/types/api/improvements";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function useOpsLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      opsService.login(email, password),
    onSuccess: ({ admin }) => {
      toast.success(`Hola, ${admin.name}`);
      router.replace("/ops");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos iniciar sesión.")),
  });
}

export function useOpsLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => opsService.logout(),
    onSuccess: () => router.replace("/ops/login"),
  });
}

// ── Leads ────────────────────────────────────────────────────────────────────

/** A status, or "DUE": the open leads to call back today or overdue. */
export function useLeads(filter?: LeadStatus | "DUE") {
  return useQuery<Lead[]>({
    queryKey: queryKeys.ops.leads(filter),
    queryFn: () =>
      filter === "DUE" ? opsService.listLeads(undefined, "today") : opsService.listLeads(filter),
  });
}

/** Where prospects drop out of the `/register` signup. */
export function useSignupFunnel(days = 30) {
  return useQuery<SignupFunnel>({
    queryKey: queryKeys.ops.signupFunnel(days),
    queryFn: () => opsService.getSignupFunnel(days),
  });
}

export function useLeadsSummary() {
  return useQuery<LeadsSummary>({
    queryKey: queryKeys.ops.leadsSummary,
    queryFn: () => opsService.getLeadsSummary(),
  });
}

/** Leads nobody has contacted yet, for the console's nav. Polls so a new one shows up on its own. */
export function useNewLeadsCount(): number {
  const { data } = useQuery<LeadsSummary>({
    queryKey: queryKeys.ops.leadsSummary,
    queryFn: () => opsService.getLeadsSummary(),
    refetchInterval: 60_000,
  });
  return data?.pipeline.NEW ?? 0;
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsService.deleteLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ops", "leads"] });
      toast.success("Solicitud eliminada");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos eliminar la solicitud.")),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) =>
      opsService.updateLead(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ops", "leads"] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos actualizar el lead.")),
  });
}

export function useProvisionLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProvisionLeadPayload;
    }) => opsService.provisionLead(id, payload),
    onSuccess: (lead) => {
      toast.success(`${lead.clubName} ya es un club. Falta la puesta a punto.`);
      void queryClient.invalidateQueries({ queryKey: ["ops"] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos crear el club.")),
  });
}

// ── Clubs ────────────────────────────────────────────────────────────────────

export function useOpsClubs() {
  return useQuery<OpsClub[]>({
    queryKey: queryKeys.ops.clubs,
    queryFn: () => opsService.listClubs(),
  });
}

/** The club's ficha. */
export function useClubDetail(clubId: string) {
  return useQuery<OpsClubDetail>({
    queryKey: queryKeys.ops.clubDetail(clubId),
    queryFn: () => opsService.getClubDetail(clubId),
  });
}

export function useUpdateClubNotes(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opsNotes: string | null) => opsService.updateClubNotes(clubId, opsNotes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.clubDetail(clubId) });
      toast.success("Notas guardadas");
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos guardar las notas.")),
  });
}

/** The text the next Monday summary to the ops channel would carry. */
export function useWeeklySummary(enabled: boolean) {
  return useQuery<{ text: string }>({
    queryKey: queryKeys.ops.weeklySummary,
    queryFn: () => opsService.getWeeklySummary(),
    enabled,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubscriptionPayload;
    }) => opsService.updateSubscription(id, payload),
    onSuccess: () => {
      toast.success("Suscripción actualizada.");
      void queryClient.invalidateQueries({ queryKey: ["ops"] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos actualizar la suscripción.")),
  });
}

export function useClubUsers(clubId: string, enabled = true) {
  return useQuery<ClubUser[]>({
    queryKey: queryKeys.ops.clubUsers(clubId),
    queryFn: () => opsService.listClubUsers(clubId),
    enabled,
  });
}

export function useResetClubUserPassword(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      opsService.resetClubUserPassword(clubId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.ops.clubUsers(clubId),
      });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No pudimos resetear la contraseña.")),
  });
}

// ── Metrics & health ─────────────────────────────────────────────────────────

export function useBusinessMetrics() {
  return useQuery<BusinessMetrics>({
    queryKey: queryKeys.ops.business,
    queryFn: () => opsService.getBusinessMetrics(),
  });
}

/** Without a month: the current one (what the clubs table shows next to each club). */
export function useProfitability(month?: string) {
  return useQuery<ProfitabilityReport>({
    queryKey: queryKeys.ops.profitability(month ?? "current"),
    queryFn: () => opsService.getProfitability(month),
  });
}

export function useBotMetrics() {
  return useQuery<BotMetrics>({
    queryKey: queryKeys.ops.bot,
    queryFn: () => opsService.getBotMetrics(),
  });
}

export function useOpsHealth() {
  return useQuery<OpsHealth>({
    queryKey: queryKeys.ops.health,
    queryFn: () => opsService.getHealth(),
    // The health screen is what you leave open when something is on fire.
    refetchInterval: 30_000,
  });
}

// ── Staff help ───────────────────────────────────────────────────────────────

/** What the clubs' desk staff searched in the "?" help without finding it. */
export function useHelpSearchMisses() {
  return useQuery<HelpSearchMiss[]>({
    queryKey: queryKeys.ops.helpSearchMisses,
    queryFn: () => opsService.getHelpSearchMisses(),
  });
}

// ── Mejoras ──────────────────────────────────────────────────────────────────

/** Every improvement we posted, drafts included. */
export function useOpsImprovements() {
  return useQuery<OpsImprovement[]>({
    queryKey: queryKeys.ops.improvements,
    queryFn: () => opsService.listImprovements(),
  });
}

export function useCreateImprovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveImprovementPayload) => opsService.createImprovement(payload),
    onSuccess: (improvement) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvements });
      toast.success(improvement.publishedAt ? "Mejora publicada" : "Borrador guardado");
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos guardar la mejora.")),
  });
}

export function useUpdateImprovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveImprovementPayload }) =>
      opsService.updateImprovement(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvements });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvementSuggestions });
      toast.success("Mejora actualizada");
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos actualizar la mejora.")),
  });
}

export function useDeleteImprovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsService.deleteImprovement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvements });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvementSuggestions });
      toast.success("Mejora eliminada");
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos eliminar la mejora.")),
  });
}

/** The clubs' suggestions, the ones waiting on us first. Polls so a new one shows up on its own. */
export function useOpsImprovementSuggestions() {
  return useQuery<OpsImprovementSuggestion[]>({
    queryKey: queryKeys.ops.improvementSuggestions,
    queryFn: () => opsService.listImprovementSuggestions(),
    refetchInterval: 60_000,
  });
}

/** Suggestions nobody at Lumarsoft has read yet, for the console's nav. */
export function useNewImprovementSuggestionsCount(): number {
  const { data } = useOpsImprovementSuggestions();
  return (data ?? []).filter((s) => s.status === "NEW").length;
}

export function useUpdateImprovementSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateImprovementSuggestionPayload }) =>
      opsService.updateImprovementSuggestion(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvementSuggestions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ops.improvements });
      toast.success("Propuesta actualizada");
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos actualizar la propuesta.")),
  });
}
