import type { SubscriptionStatus } from "@/types/api/clubs";

/** One credit pack on sale (`GET /billing` → catalog). */
export interface CreditPackOffer {
  key: string;
  credits: number;
  priceCents: number;
  /** Marked "Más popular" and selected by default. */
  popular: boolean;
}

export interface ActiveCreditPack {
  id: string;
  credits: number;
  remaining: number;
  expiresAt: string;
}

export type CreditPackStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreditPackPurchase {
  id: string;
  packKey: string;
  credits: number;
  priceCents: number;
  status: CreditPackStatus;
  createdAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
}

/** The owner's "Facturación" page (`GET /billing`). */
export interface BillingOverview {
  plan: { key: string; name: string; known: boolean };
  subscription: {
    status: SubscriptionStatus;
    severity: "ok" | "trial" | "warning" | "blocked";
    /** End of the paid period, or of the trial. */
    renewsAt: string | null;
  };
  credits: {
    month: string;
    used: number;
    included: number | null;
    fromPacks: number;
    extraBalance: number;
    available: number | null;
    percent: number | null;
  };
  packs: ActiveCreditPack[];
  purchases: CreditPackPurchase[];
  catalog: CreditPackOffer[];
  validityMonths: number;
  /** Packs need an active plan. */
  canBuy: boolean;
}

export interface BuyCreditPackResponse {
  purchaseId: string;
  checkoutUrl: string;
}
