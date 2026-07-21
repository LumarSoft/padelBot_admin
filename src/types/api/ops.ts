/** Types of the ops console API (`/ops/*`). Mirrors `padelBot_api/src/ops`. */

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

export interface OpsClub {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
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
}

export interface UpdateSubscriptionPayload {
  status: SubscriptionStatus;
  months?: number;
  days?: number;
  plan?: string;
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
