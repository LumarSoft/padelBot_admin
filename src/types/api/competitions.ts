/** Torneos and peñas — mirrors `api/src/competitions`. Money in cents; the fee is per player. */

export type CompetitionKind = "TOURNAMENT" | "PENA";
export type CompetitionStatus = "OPEN" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
/** ONE_SET = americano / peña; BEST_OF_THREE = completo. */
export type MatchFormat = "ONE_SET" | "BEST_OF_THREE";
export type CategoryFormat = "ROUND_ROBIN" | "GROUPS_KNOCKOUT" | "KNOCKOUT";
export type MatchStage = "GROUP" | "KNOCKOUT";
export type PaymentMethod = "CASH" | "QR" | "TRANSFER";
/** Games per set from pair A's side: [[6,4],[3,6],[10,8]]. */
export type SetScore = [number, number];

export interface CompetitionSession {
  id: string;
  /** "YYYY-MM-DD", club-local. */
  dateKey: string;
  /** "HH:MM"; an end at or before the start ends past midnight. */
  startTime: string;
  endTime: string;
}

export interface CompetitionCourtRef {
  id: string;
  name: string;
}

export interface CompetitionSummary {
  id: string;
  kind: CompetitionKind;
  name: string;
  description: string | null;
  status: CompetitionStatus;
  matchFormat: MatchFormat;
  entryFeeCents: number;
  createdAt: string;
  updatedAt: string;
  sessions: CompetitionSession[];
  courts: CompetitionCourtRef[];
  _count: { pairs: number; categories: number };
}

export interface StandingRow {
  pairId: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface CompetitionGroup {
  id: string;
  name: string;
  position: number;
  standings: StandingRow[];
}

export interface CompetitionCategory {
  id: string;
  name: string;
  format: CategoryFormat;
  groupSize: number;
  advancePerGroup: number;
  maxPairs: number | null;
  fixtureGeneratedAt: string | null;
  bracketGeneratedAt: string | null;
  /** ROUND_ROBIN categories with a fixture. */
  standings: StandingRow[] | null;
  groups: CompetitionGroup[];
}

export interface CompetitionPlayer {
  id: string;
  position: number;
  name: string;
  phone: string | null;
  playerId: string | null;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface CompetitionPair {
  id: string;
  categoryId: string;
  groupId: string | null;
  seed: number | null;
  createdAt: string;
  players: CompetitionPlayer[];
}

export interface CompetitionMatch {
  id: string;
  categoryId: string;
  stage: MatchStage;
  groupId: string | null;
  /** Round robin: the round / wave. Knockout: 1 = first round … last = final. */
  round: number;
  position: number;
  pairAId: string | null;
  pairBId: string | null;
  placeholderA: string | null;
  placeholderB: string | null;
  courtId: string | null;
  startsAt: string | null;
  sets: SetScore[] | null;
  winnerPairId: string | null;
  nextMatchId: string | null;
  nextSlot: "A" | "B" | null;
}

export interface CompetitionDetail extends Omit<CompetitionSummary, "_count"> {
  _count: { pairs: number; categories: number };
  categories: CompetitionCategory[];
  pairs: CompetitionPair[];
  matches: CompetitionMatch[];
  fees: { expectedCents: number; collectedCents: number };
}

export interface CompetitionFilters {
  kind?: CompetitionKind;
  status?: CompetitionStatus;
}

export interface SessionInput {
  dateKey: string;
  startTime: string;
  endTime: string;
}

export interface CategoryInput {
  name: string;
  format: CategoryFormat;
  groupSize?: number;
  advancePerGroup?: number;
  maxPairs?: number;
}

export interface CreateCompetitionRequest {
  kind: CompetitionKind;
  name: string;
  description?: string;
  matchFormat?: MatchFormat;
  entryFeeCents?: number;
  courtIds: string[];
  sessions: SessionInput[];
  /** Torneo only. */
  categories?: CategoryInput[];
}

export interface UpdateCompetitionRequest {
  name?: string;
  description?: string;
  matchFormat?: MatchFormat;
  entryFeeCents?: number;
  courtIds?: string[];
  sessions?: SessionInput[];
  status?: Exclude<CompetitionStatus, "CANCELLED">;
}

export interface PairPlayerInput {
  name: string;
  phone?: string;
}

export interface CreatePairRequest {
  categoryId?: string;
  players: [PairPlayerInput, PairPlayerInput];
  seed?: number;
}

export interface UpdatePairRequest {
  categoryId?: string;
  players?: [PairPlayerInput, PairPlayerInput];
  seed?: number | null;
}

export interface UpdatePlayerPaymentRequest {
  paid: boolean;
  method?: PaymentMethod;
}

export interface UpdateMatchRequest {
  sets?: SetScore[] | null;
  courtId?: string | null;
  startsAt?: string | null;
}
