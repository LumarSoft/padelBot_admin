/**
 * DEPOSIT = charge a seña (a % of the price); FULL = charge the whole court; NONE = charge
 * nothing — the bot books and confirms on the spot (no alias, no transfer).
 */
export type DepositMode = "DEPOSIT" | "FULL" | "NONE";

/** AUTO = reconcile via MercadoPago; RECEIPT = player sends a receipt photo verified by hand. */
export type PaymentVerificationMode = "AUTO" | "RECEIPT";

/**
 * What a player may do from WhatsApp when they can't make it. The bot never *cancels* — it
 * MOVES the booking, which keeps the deposit alive, frees the court for the waitlist, and takes
 * no money out of the club. A real cancellation stays a decision of the club, from the panel.
 *
 * SELF = the bot moves it; REQUEST = the staff is notified and decides; OFF = not offered.
 */
export type PlayerRescheduleMode = "SELF" | "REQUEST" | "OFF";

export interface TransferConfig {
  /** MercadoPago alias/CVU players transfer the deposit to. */
  transferAlias: string | null;
  /** Account holder ("titular") shown to players alongside the alias. */
  transferHolder: string | null;
  /** Whether the bot charges a partial deposit (seña), the full court price, or nothing. */
  depositMode: DepositMode;
  /** Seña as a percentage of the court price (1–100). Used when depositMode = DEPOSIT. */
  depositPercent: number;
  /** When true, the bot asks the player's DNI and only auto-confirms if the payer's DNI matches. */
  requireDniMatch: boolean;
  /** How the club verifies deposits: automatically (MercadoPago) or by receipt photo (manual). */
  paymentVerificationMode: PaymentVerificationMode;
  /** Hours before the slot inside which cancelling forfeits the deposit; earlier → player credit. */
  cancellationWindowHours: number;
  /** What the player may do from WhatsApp when they can't make it. */
  playerReschedule: PlayerRescheduleMode;
  /** Below this many hours before the slot, SELF degrades to REQUEST. Null = no cutoff. */
  playerRescheduleCutoffHours: number | null;
  /** How many times ONE booking may be moved by the player. */
  maxPlayerReschedules: number;
}

export interface UpdateTransferConfigRequest {
  transferAlias?: string;
  transferHolder?: string;
  depositMode?: DepositMode;
  depositPercent?: number;
  requireDniMatch?: boolean;
  paymentVerificationMode?: PaymentVerificationMode;
  cancellationWindowHours?: number;
  playerReschedule?: PlayerRescheduleMode;
  /** 0 = no cutoff. */
  playerRescheduleCutoffHours?: number;
  maxPlayerReschedules?: number;
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

/** One bot FAQ entry: a player question and the answer the bot should give. */
export interface FaqEntry {
  question: string;
  answer: string;
}

/** Replaces the whole FAQ list (the "Bot" section edits it as a set). */
export interface UpdateFaqRequest {
  entries: FaqEntry[];
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

/** Screen the connect flow started from, so the OAuth callback returns the owner to it. */
export type MercadoPagoConnectOrigin = "configuracion" | "setup";

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

/** Something counted against a plan limit; `limit` null = no limit. */
export interface PlanUsage {
  used: number;
  limit: number | null;
}

/** The club's plan, its limits and how much of them is used (`GET /clubs/me/plan`). */
export interface ClubPlanOverview {
  plan: {
    key: string;
    name: string;
    /** False when the stored key is none of the three plans: nothing is restricted. */
    known: boolean;
  };
  courts: PlanUsage;
  /** Active users, the owner included. */
  users: PlanUsage;
}

export interface WhatsAppLine {
  id: string;
  phoneNumberId: string;
  displayPhone: string;
  isActive: boolean;
  /** The number also stays on the club's WhatsApp Business app (Meta "coexistence"). */
  coexistence?: boolean;
}

/** The automatic WhatsApp "¿venís?" to the fijos. */
export interface FixedConfirmationConfig {
  enabled: boolean;
  /** Hours before the turno the question goes out (24 = the day before, same time). */
  leadHours: number;
}

export interface UpdateFixedConfirmationRequest {
  enabled?: boolean;
  /** One of 3, 6, 12, 24, 48. */
  leadHours?: number;
}
