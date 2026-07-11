import { apiClient } from "@/lib/api/client";
import type {
  ClubProfile,
  SubscriptionState,
  WhatsAppLine,
  ConnectMercadoPagoResponse,
  MercadoPagoStatus,
  TransferConfig,
  UpdateClubProfileRequest,
  UpdateTransferConfigRequest,
} from "@/types/api/clubs";

export const clubsService = {
  getProfile(): Promise<ClubProfile> {
    return apiClient.get<ClubProfile>("/api/clubs/profile");
  },
  getSubscription(): Promise<SubscriptionState> {
    return apiClient.get<SubscriptionState>("/api/clubs/subscription");
  },
  getWhatsAppLines(): Promise<WhatsAppLine[]> {
    return apiClient.get<WhatsAppLine[]>("/api/whatsapp-lines");
  },
  updateProfile(body: UpdateClubProfileRequest): Promise<ClubProfile> {
    return apiClient.patch<ClubProfile>("/api/clubs/profile", body);
  },
  getTransferConfig(): Promise<TransferConfig> {
    return apiClient.get<TransferConfig>("/api/clubs/transfer-config");
  },
  updateTransferConfig(body: UpdateTransferConfigRequest): Promise<TransferConfig> {
    return apiClient.patch<TransferConfig>("/api/clubs/transfer-config", body);
  },
  getMercadoPagoStatus(): Promise<MercadoPagoStatus> {
    return apiClient.get<MercadoPagoStatus>("/api/clubs/mercadopago");
  },
  connectMercadoPago(): Promise<ConnectMercadoPagoResponse> {
    return apiClient.post<ConnectMercadoPagoResponse>("/api/clubs/mercadopago/connect", {});
  },
  disconnectMercadoPago(): Promise<{ disconnected: true }> {
    return apiClient.del<{ disconnected: true }>("/api/clubs/mercadopago");
  },
};
