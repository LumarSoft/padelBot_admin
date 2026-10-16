/** Players who asked the WhatsApp bot to sign up for a torneo or peña — mirrors `api/src/competitions`. */

export type SignupRequestStatus = "PENDING" | "HANDLED" | "DISMISSED";

export interface CompetitionSignupRequest {
  id: string;
  competitionId: string;
  /** The player's WhatsApp number: opens their chat in the panel's WhatsApp inbox. */
  waId: string;
  playerName: string | null;
  status: SignupRequestStatus;
  handledAt: string | null;
  createdAt: string;
  competition: { id: string; name: string; kind: "TOURNAMENT" | "PENA"; status: string };
}

export interface SignupRequestFilters {
  status?: SignupRequestStatus;
  competitionId?: string;
}
