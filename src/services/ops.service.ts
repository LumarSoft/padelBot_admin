import { apiClient } from "@/lib/api/client";
import type {
  BotMetrics,
  BusinessMetrics,
  ClubUser,
  Lead,
  LeadStatus,
  LeadsSummary,
  OpsAdmin,
  OpsClub,
  OpsHealth,
  ProvisionLeadPayload,
  ResetPasswordResult,
  SubscriptionState,
  UpdateLeadPayload,
  UpdateSubscriptionPayload,
} from "@/types/api/ops";

/** Client for the ops console BFF (`/api/ops/*`). */
export const opsService = {
  login(email: string, password: string): Promise<{ admin: OpsAdmin }> {
    return apiClient.post<{ admin: OpsAdmin }>("/api/ops/auth/login", {
      email,
      password,
    });
  },
  logout(): Promise<void> {
    return apiClient.post<void>("/api/ops/auth/logout");
  },

  listLeads(status?: LeadStatus): Promise<Lead[]> {
    const qs = status ? `?status=${status}` : "";
    return apiClient.get<Lead[]>(`/api/ops/leads${qs}`);
  },
  getLeadsSummary(): Promise<LeadsSummary> {
    return apiClient.get<LeadsSummary>("/api/ops/leads/summary");
  },
  updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/ops/leads/${id}`, payload);
  },
  provisionLead(id: string, payload: ProvisionLeadPayload): Promise<Lead> {
    return apiClient.post<Lead>(`/api/ops/leads/${id}/provision`, payload);
  },

  listClubs(): Promise<OpsClub[]> {
    return apiClient.get<OpsClub[]>("/api/ops/clubs");
  },
  updateSubscription(
    id: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionState> {
    return apiClient.patch<SubscriptionState>(
      `/api/ops/clubs/${id}/subscription`,
      payload,
    );
  },
  listClubUsers(id: string): Promise<ClubUser[]> {
    return apiClient.get<ClubUser[]>(`/api/ops/clubs/${id}/users`);
  },
  resetClubUserPassword(
    id: string,
    userId: number,
  ): Promise<ResetPasswordResult> {
    return apiClient.post<ResetPasswordResult>(
      `/api/ops/clubs/${id}/users/${userId}/reset-password`,
    );
  },

  getBusinessMetrics(): Promise<BusinessMetrics> {
    return apiClient.get<BusinessMetrics>("/api/ops/metrics/business");
  },
  getBotMetrics(): Promise<BotMetrics> {
    return apiClient.get<BotMetrics>("/api/ops/metrics/bot");
  },
  getHealth(): Promise<OpsHealth> {
    return apiClient.get<OpsHealth>("/api/ops/health");
  },
};
