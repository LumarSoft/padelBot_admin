/** DEPOSIT = charge a seña (a % of the price); FULL = charge the whole court. */
export type DepositMode = "DEPOSIT" | "FULL";

export interface TransferConfig {
  /** MercadoPago alias/CVU players transfer the deposit to. */
  transferAlias: string | null;
  /** Account holder ("titular") shown to players alongside the alias. */
  transferHolder: string | null;
  /** Whether the bot charges a partial deposit (seña) or the full court price. */
  depositMode: DepositMode;
  /** Seña as a percentage of the court price (1–100). Used when depositMode = DEPOSIT. */
  depositPercent: number;
  /** When true, the bot asks the player's DNI and only auto-confirms if the payer's DNI matches. */
  requireDniMatch: boolean;
}

export interface UpdateTransferConfigRequest {
  transferAlias?: string;
  transferHolder?: string;
  depositMode?: DepositMode;
  depositPercent?: number;
  requireDniMatch?: boolean;
}

export interface ClubProfile {
  name: string;
  slug: string;
}

export interface UpdateClubProfileRequest {
  name: string;
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
