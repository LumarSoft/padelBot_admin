/** DEPOSIT = charge a seña (a % of the price); FULL = charge the whole court. */
export type DepositMode = "DEPOSIT" | "FULL";

/** AUTO = reconcile via MercadoPago; RECEIPT = player sends a receipt photo verified by hand. */
export type PaymentVerificationMode = "AUTO" | "RECEIPT";

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
  /** How the club verifies deposits: automatically (MercadoPago) or by receipt photo (manual). */
  paymentVerificationMode: PaymentVerificationMode;
  /** Hours before the slot inside which cancelling forfeits the deposit; earlier → player credit. */
  cancellationWindowHours: number;
}

export interface UpdateTransferConfigRequest {
  transferAlias?: string;
  transferHolder?: string;
  depositMode?: DepositMode;
  depositPercent?: number;
  requireDniMatch?: boolean;
  paymentVerificationMode?: PaymentVerificationMode;
  cancellationWindowHours?: number;
}

export interface ClubProfile {
  name: string;
  slug: string;
  /** Extra line the bot appends to its welcome (reglas de la casa). */
  botWelcomeExtra: string | null;
  /** "Cómo llegar" the bot answers on request. */
  locationInfo: string | null;
}

export interface UpdateClubProfileRequest {
  name: string;
  botWelcomeExtra?: string;
  locationInfo?: string;
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

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

/** Effective subscription state (mirrors the API's SubscriptionState). */
export interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus;
  plan: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  severity: "ok" | "trial" | "warning" | "blocked";
  botAllowed: boolean;
  daysLeft: number | null;
}

export interface WhatsAppLine {
  id: string;
  phoneNumberId: string;
  displayPhone: string;
  isActive: boolean;
}
