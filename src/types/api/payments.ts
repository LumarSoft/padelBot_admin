/** Reconciliation health snapshot (mirrors the API's PaymentsHealth). */
export interface PaymentsHealth {
  /** True when the payments poller completed a tick recently. */
  reconciliationActive: boolean;
  lastPollOkAt: string | null;
  consecutiveFailures: number;
  /** Consecutive MercadoPago failures for this club (own-token path). */
  clubConsecutiveFailures: number;
  /** When the last booking was auto-confirmed from a real transfer. */
  lastAutoConfirmationAt: string | null;
  pendingCount: number;
}

export interface MoneyInMovement {
  id: string;
  /** True when this movement already confirmed a booking (settled). */
  alreadyUsed: boolean;
  amountCents: number;
  amountPesos: number;
  dateCreated: string;
  operationType: string;
  payerName: string | null;
  payerCuit: string | null;
  derivedDni: string | null;
  payerMpUserId: string | null;
  payerEmail: string | null;
  hasPayerIdentity: boolean;
  pendingMatch: {
    bookingId: string;
    playerName: string;
    transferAmountCents: number;
    playerDni: string | null;
    dniMatches: boolean;
  } | null;
}

export interface MoneyInDiagnostics {
  account: "own" | "shared";
  windowMinutes: number;
  count: number;
  withIdentity: number;
  movements: MoneyInMovement[];
}
