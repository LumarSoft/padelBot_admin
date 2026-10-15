import type { PlanKey } from "@/lib/plans";
import type { PlanUsage } from "@/types/api/clubs";

/** Types of the ops console API (`/ops/*`). Mirrors `api/src/ops`. */

export interface OpsAdmin {
  id: string;
  email: string;
  name: string;
}

// ── Leads (the `/register` signup form) ──────────────────────────────────────

export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "LOST";

/** Everything the prospect told us, plus our sales file on them. */
export interface Lead {
  id: string;
  clubName: string;
  ownerName: string;
  email: string;
  phone: string;
  message: string | null;
  city: string | null;

  // Operación — pre-loads the /setup wizard.
  courtCount: number | null;
  courtType: string | null;
  slotDurationMinutes: number | null;
  openTime: string | null;
  closeTime: string | null;
  avgPriceCents: number | null;

  // Cobros — decides how painful provisioning will be.
  chargesDeposit: string | null;
  hasMercadoPago: string | null;

  // Contexto comercial.
  currentSystem: string | null;
  biggestPain: string | null;
  fixedSlots: string | null;
  howFound: string | null;
  contactWindow: string | null;
  contactWindowNote: string | null;
  /** The pricing card they came from (`/register?plan=…`); null when they didn't pick one. */
  plan: PlanKey | null;

  // Our side of the file.
  status: LeadStatus;
  internalNotes: string | null;
  contactedAt: string | null;
  convertedClubId: string | null;
  createdAt: string;
}

export interface LeadsSummary {
  pipeline: Record<LeadStatus, number>;
  last30Days: number;
  medianResponseHours: number | null;
  byChannel: { value: string; leads: number; converted: number }[];
  byPain: { value: string; count: number }[];
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  internalNotes?: string;
}

export interface ProvisionLeadPayload {
  password: string;
  clubName?: string;
  email?: string;
  ownerName?: string;
  /** Defaults API-side to the lead's plan, then to Saque. */
  plan?: PlanKey;
}

// ── Clubs (tenants) ──────────────────────────────────────────────────────────

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface SubscriptionState {
  subscriptionStatus: SubscriptionStatus;
  plan: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  severity: "ok" | "trial" | "warning" | "blocked";
  botAllowed: boolean;
  daysLeft: number | null;
}

/** One word per club, the most urgent that applies (api `ops/lib/club-health.ts`). */
export type ClubHealthStatus =
  | "inactive"
  | "atRisk"
  | "overCredits"
  | "trialEnding"
  | "setup"
  | "starting"
  | "healthy";

export interface OpsClub {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  /** The sales demo: shown apart, never counted among the states. */
  isDemo: boolean;
  /** How the club is doing, and every signal behind it. */
  health: { status: ClubHealthStatus; reasons: string[] };
  subscription: SubscriptionState;
  readiness: {
    courts: number;
    paymentsConfigured: boolean;
    mpConnected: boolean;
    whatsappLines: number;
    ready: boolean;
    setupCompletedAt: string | null;
  };
  activity: {
    bookingsBot: number;
    bookingsPanel: number;
    depositsCents: number;
    conversations: number;
    lastPanelLoginAt: string | null;
    dormant: boolean;
  };
  llmCostMicroUsd: number;
  /** The plan's limits against what the club uses; no limits for an unknown key. */
  plan: {
    name: string;
    known: boolean;
    courts: PlanUsage;
    users: PlanUsage;
    /** This calendar month. Over 100% never cuts the bot: it's a sales call. */
    aiCredits: PlanUsage & {
      percent: number | null;
      /** Plan + pack credits (spent this month + left); null = no allowance. */
      available: number | null;
    };
    /** Predates the plans: keeps every module whatever its plan, until ops clears it. */
    grandfatheredFeatures: boolean;
  };
}

export interface UpdateSubscriptionPayload {
  status: SubscriptionStatus;
  months?: number;
  days?: number;
  plan?: PlanKey;
  grandfatheredFeatures?: boolean;
}

export type ClubUserRoleApi = "OWNER" | "STAFF";

/** A club's panel user, as ops sees it when handling a password-reset request. */
export interface ClubUser {
  id: number;
  name: string;
  email: string;
  role: ClubUserRoleApi;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

/** Result of a password reset — the temp password is shown once, never stored. */
export interface ResetPasswordResult {
  email: string;
  tempPassword: string;
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export interface BusinessMetrics {
  mrrCents: number;
  clubsWithoutPrice: number;
  clubs: {
    total: number;
    trial: number;
    active: number;
    pastDue: number;
    cancelled: number;
    ready: number;
  };
  activation: {
    provisioned: number;
    activated: number;
    medianDaysToFirstBooking: number | null;
  };
  gmvCents: number;
  bookings: { bot: number; panel: number };
  series: { date: string; bot: number; panel: number }[];
}

export interface BotMetrics {
  funnel: {
    conversations: number;
    bookingsStarted: number;
    bookingsConfirmed: number;
    handedToHuman: number;
  };
  byState: { state: string; count: number }[];
  messages: { user: number; bot: number; admin: number };
  cost: {
    totalMicroUsd: number;
    calls: number;
    microUsdPerConfirmedBooking: number | null;
    perClub: {
      clubId: string;
      clubName: string;
      microUsd: number;
      calls: number;
    }[];
    series: { date: string; microUsd: number }[];
  };
}

// ── Health ───────────────────────────────────────────────────────────────────

export type HealthIssueKind =
  | "POLLER_DOWN"
  | "CLUB_MP_FAILING"
  | "STUCK_PENDING"
  | "RECEIPT_AWAITING_REVIEW"
  | "MP_TOKEN_EXPIRING"
  | "ADVISOR_WAITING"
  | "CLUB_NOT_LIVE";

export interface HealthIssue {
  kind: HealthIssueKind;
  severity: "critical" | "warning";
  message: string;
  clubId?: string;
  clubName?: string;
  count?: number;
}

export interface OpsHealth {
  poller: {
    reconciliationActive: boolean;
    lastPollOkAt: string | null;
    consecutiveFailures: number;
    failingClubs: { clubId: string; consecutiveFailures: number }[];
  };
  issues: HealthIssue[];
  webhookDedupRows: number;
  checkedAt: string;
}

// ── Profitability ────────────────────────────────────────────────────────────

export type MarginFlag = "negative" | "low" | "noRevenue" | null;

/** One club in one month (`GET /ops/profitability`). Money in ARS cents. */
export interface ClubProfitRow {
  id: string;
  name: string;
  plan: string;
  subscriptionStatus: SubscriptionStatus;
  /** The sales demo: listed, never in the totals. */
  isDemo: boolean;
  /** `grossCents` is what it paid; the rest is net of IVA (and packs, of MercadoPago's fee). */
  revenue: { grossCents: number; planCents: number; packsCents: number; totalCents: number };
  messages: { total: number; free: number; paid: number };
  cost: { metaCents: number; aiCents: number; totalCents: number };
  marginCents: number;
  marginPercent: number | null;
  flag: MarginFlag;
  credits: { used: number; included: number | null };
}

export interface ProfitabilityReport {
  month: string;
  metaMessagePriceUsd: number;
  /** The dollar used: fetched daily (dolarapi), or a fallback when the fetch never worked. */
  usdArs: {
    rate: number;
    quote: "tarjeta" | "oficial";
    source: "dolarapi" | "config" | "default";
    dateKey: string | null;
    /** A fallback, or this month's last fetch is days old. */
    stale: boolean;
  };
  /** Where IVA lands: monotributo pays the IVA of Meta, OpenAI and MP; inscripto nets it out of prices. */
  taxRegime: "monotributo" | "inscripto";
  mpFeePercent: number;
  totals: {
    grossRevenueCents: number;
    revenueCents: number;
    costCents: number;
    metaCents: number;
    aiCents: number;
    marginCents: number;
    marginPercent: number | null;
    messages: { total: number; free: number; paid: number };
  };
  clubs: ClubProfitRow[];
}
