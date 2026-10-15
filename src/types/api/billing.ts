import type { SubscriptionStatus } from "@/types/api/clubs";

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
    /** The plan's credits for the month; null for an unknown plan. */
    included: number | null;
    percent: number | null;
  };
}
