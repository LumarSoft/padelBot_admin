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
  ClubUser,
  Lead,
  LeadStatus,
  LeadsSummary,
  OpsClub,
  OpsHealth,
  ProvisionLeadPayload,
  UpdateLeadPayload,
  UpdateSubscriptionPayload,
} from "@/types/api/ops";

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

export function useLeads(status?: LeadStatus) {
  return useQuery<Lead[]>({
    queryKey: queryKeys.ops.leads(status),
    queryFn: () => opsService.listLeads(status),
  });
}

export function useLeadsSummary() {
  return useQuery<LeadsSummary>({
    queryKey: queryKeys.ops.leadsSummary,
    queryFn: () => opsService.getLeadsSummary(),
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
