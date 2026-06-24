export type ConversationMode = "AI" | "HUMAN";
export type MessageRole = "USER" | "BOT" | "ADMIN";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
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

export interface ConversationSession {
  id: string;
  waId: string;
  playerName: string | null;
  mode: ConversationMode;
  state: string;
}

export interface ConversationDetail {
  session: ConversationSession;
  messages: ConversationMessage[];
}
