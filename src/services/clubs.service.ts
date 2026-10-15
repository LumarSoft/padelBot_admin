import { apiClient } from "@/lib/api/client";
import type {
  ClubPlanOverview,
  ClubProfile,
  SubscriptionState,
  WhatsAppLine,
  ConnectMercadoPagoResponse,
  MercadoPagoConnectOrigin,
  MercadoPagoStatus,
  TransferConfig,
  UpdateClubProfileRequest,
  UpdateTransferConfigRequest,
  FaqEntry,
  UpdateFaqRequest,
  FixedConfirmationConfig,
  UpdateFixedConfirmationRequest,
} from "@/types/api/clubs";
import type {
  CreateWhatsAppLineRequest,
  EmbeddedSignupConfig,
  EmbeddedSignupRequest,
} from "@/types/api/onboarding";

export const clubsService = {
  getProfile(): Promise<ClubProfile> {
    return apiClient.get<ClubProfile>("/api/clubs/profile");
  },
  getSubscription(): Promise<SubscriptionState> {
    return apiClient.get<SubscriptionState>("/api/clubs/subscription");
  },
  getPlan(): Promise<ClubPlanOverview> {
    return apiClient.get<ClubPlanOverview>("/api/clubs/plan");
  },
  dismissCreditsNotice(): Promise<void> {
    return apiClient.post<void>("/api/clubs/plan/credits-notice/dismiss");
  },
  getWhatsAppLines(): Promise<WhatsAppLine[]> {
    return apiClient.get<WhatsAppLine[]>("/api/whatsapp-lines");
  },
  createWhatsAppLine(body: CreateWhatsAppLineRequest): Promise<WhatsAppLine> {
    return apiClient.post<WhatsAppLine>("/api/whatsapp-lines", body);
  },
  getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfig> {
    return apiClient.get<EmbeddedSignupConfig>(
      "/api/whatsapp-lines/embedded-signup/config",
    );
  },
  connectEmbeddedSignup(body: EmbeddedSignupRequest): Promise<WhatsAppLine> {
    return apiClient.post<WhatsAppLine>(
      "/api/whatsapp-lines/embedded-signup",
      body,
    );
  },
  deleteWhatsAppLine(id: string): Promise<void> {
    return apiClient.del<void>(`/api/whatsapp-lines/${id}`);
  },
  updateProfile(body: UpdateClubProfileRequest): Promise<ClubProfile> {
    return apiClient.patch<ClubProfile>("/api/clubs/profile", body);
  },
  getFaq(): Promise<FaqEntry[]> {
    return apiClient.get<FaqEntry[]>("/api/clubs/faq");
  },
  updateFaq(body: UpdateFaqRequest): Promise<FaqEntry[]> {
    return apiClient.patch<FaqEntry[]>("/api/clubs/faq", body);
  },
  getTransferConfig(): Promise<TransferConfig> {
    return apiClient.get<TransferConfig>("/api/clubs/transfer-config");
  },
  updateTransferConfig(
    body: UpdateTransferConfigRequest,
  ): Promise<TransferConfig> {
    return apiClient.patch<TransferConfig>("/api/clubs/transfer-config", body);
  },
  getFixedConfirmation(): Promise<FixedConfirmationConfig> {
    return apiClient.get<FixedConfirmationConfig>("/api/clubs/fixed-confirmation");
  },
  updateFixedConfirmation(
    body: UpdateFixedConfirmationRequest,
  ): Promise<FixedConfirmationConfig> {
    return apiClient.patch<FixedConfirmationConfig>("/api/clubs/fixed-confirmation", body);
  },
  getMercadoPagoStatus(): Promise<MercadoPagoStatus> {
    return apiClient.get<MercadoPagoStatus>("/api/clubs/mercadopago");
  },
  connectMercadoPago(
    origin: MercadoPagoConnectOrigin,
  ): Promise<ConnectMercadoPagoResponse> {
    return apiClient.post<ConnectMercadoPagoResponse>(
      "/api/clubs/mercadopago/connect",
      {
        origin,
      },
    );
  },
  disconnectMercadoPago(): Promise<{ disconnected: true }> {
    return apiClient.del<{ disconnected: true }>("/api/clubs/mercadopago");
  },
};
