import { apiClient } from "@/lib/api/client";
import type {
  ConnectMercadoPagoResponse,
  MercadoPagoStatus,
  TransferConfig,
  UpdateTransferConfigRequest,
} from "@/types/api/clubs";

export const clubsService = {
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
