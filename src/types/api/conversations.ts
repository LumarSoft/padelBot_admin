export type ConversationMode = "AI" | "HUMAN";
export type MessageRole = "USER" | "BOT" | "ADMIN";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  /** Client-only: true for an optimistic admin message still being delivered. */
  pending?: boolean;
}

export interface LastMessage {
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  waId: string;
  playerName: string | null;
  mode: ConversationMode;
  state: string;
  /** True when the player asked for a human advisor and no staff has replied yet. */
  needsAdvisor: boolean;
  updatedAt: string;
  lastMessage: LastMessage | null;
}

export interface NextBooking {
  startsAt: string;
  courtName: string;
}

export interface ConversationSession {
  id: string;
  waId: string;
  playerName: string | null;
  mode: ConversationMode;
  state: string;
  needsAdvisor: boolean;
  /** When the player first messaged the club ("cliente desde"). */
  createdAt: string;
  /** Total confirmed reservations this player has made (all time). */
  bookingsConfirmed: number;
  /** Confirmed reservations still in the future. */
  bookingsUpcoming: number;
  /** The player's next upcoming confirmed reservation, if any. */
  nextBooking: NextBooking | null;
  /** DNI the bot last captured for this player, if any. */
  playerDni: string | null;
}

export interface ConversationDetail {
  session: ConversationSession;
  messages: ConversationMessage[];
}
