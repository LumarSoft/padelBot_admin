export interface TransferConfig {
  /** MercadoPago alias/CVU players transfer the deposit to. */
  transferAlias: string | null;
  /** Account holder ("titular") shown to players alongside the alias. */
  transferHolder: string | null;
}

export interface UpdateTransferConfigRequest {
  transferAlias?: string;
  transferHolder?: string;
}

export interface MercadoPagoStatus {
  /** Whether the club connected its own MercadoPago account via OAuth. */
  connected: boolean;
  connectedAt: string | null;
  /** MercadoPago user id of the connected account. */
  mpUserId: string | null;
}

export interface ConnectMercadoPagoResponse {
  /** URL the owner's browser must visit to authorize their MercadoPago account. */
  url: string;
}
