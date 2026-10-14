/** "Tu primer día" tasks, in the order the panel teaches them (mirrors the API ids). */
export type FirstDayTaskId =
  | "booking"
  | "consumption"
  | "deskPayment"
  | "deposit"
  | "reschedule";

/** The caller's checklist — every task ticked from what they actually did. */
export interface FirstDayStatus {
  tasks: { id: FirstDayTaskId; done: boolean }[];
  doneCount: number;
  total: number;
  complete: boolean;
  /** When the user closed the card on the Resumen (null = still showing). */
  dismissedAt: string | null;
}

/** One employee's progress, for the owner's team table ("4 de 5"). */
export interface TeamMemberFirstDay {
  userId: number;
  done: FirstDayTaskId[];
  doneCount: number;
  total: number;
}

/** One of the club's own desk Q&As ("reglas de la casa"). */
export interface HouseRule {
  question: string;
  answer: string;
}

export interface UpdateHouseRulesRequest {
  entries: HouseRule[];
}

/** A help search some club's staff made without finding an answer (ops console). */
export interface HelpSearchMiss {
  query: string;
  count: number;
  lastSearchedAt: string;
  clubId: string;
  clubName: string;
}
