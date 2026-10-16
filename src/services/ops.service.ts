import { apiClient } from "@/lib/api/client";
import type { HelpSearchMiss } from "@/types/api/help";
import type {
  BotMetrics,
  BusinessMetrics,
  ProfitabilityReport,
  ClubUser,
  Lead,
  LeadStatus,
  LeadsSummary,
  OpsAdmin,
  OpsClub,
  OpsClubDetail,
  SignupFunnel,
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

  /** `due: "today"`: the open leads to call back today or overdue, instead of a status. */
  listLeads(status?: LeadStatus, due?: "today"): Promise<Lead[]> {
    const qs = due ? `?due=${due}` : status ? `?status=${status}` : "";
    return apiClient.get<Lead[]>(`/api/ops/leads${qs}`);
  },
  getSignupFunnel(days = 30): Promise<SignupFunnel> {
    return apiClient.get<SignupFunnel>(`/api/ops/signup-funnel?days=${days}`);
  },
  getLeadsSummary(): Promise<LeadsSummary> {
    return apiClient.get<LeadsSummary>("/api/ops/leads/summary");
  },
  deleteLead(id: string): Promise<void> {
    return apiClient.del<void>(`/api/ops/leads/${encodeURIComponent(id)}`);
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
  getClubDetail(id: string): Promise<OpsClubDetail> {
    return apiClient.get<OpsClubDetail>(`/api/ops/clubs/${encodeURIComponent(id)}`);
  },
  updateClubNotes(id: string, opsNotes: string | null): Promise<{ opsNotes: string | null }> {
    return apiClient.patch<{ opsNotes: string | null }>(
      `/api/ops/clubs/${encodeURIComponent(id)}/notes`,
      { opsNotes },
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
  /** Without a month, the API's current (club-local) one. */
  getProfitability(month?: string): Promise<ProfitabilityReport> {
    return apiClient.get<ProfitabilityReport>(
      `/api/ops/profitability${month ? `?month=${encodeURIComponent(month)}` : ""}`,
    );
  },
  getWeeklySummary(): Promise<{ text: string }> {
    return apiClient.get<{ text: string }>("/api/ops/weekly-summary");
  },
  getBotMetrics(): Promise<BotMetrics> {
    return apiClient.get<BotMetrics>("/api/ops/metrics/bot");
  },
  getHealth(): Promise<OpsHealth> {
    return apiClient.get<OpsHealth>("/api/ops/health");
  },
  getHelpSearchMisses(): Promise<HelpSearchMiss[]> {
    return apiClient.get<HelpSearchMiss[]>("/api/ops/help/search-misses");
  },
};
