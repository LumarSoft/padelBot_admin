/** Where an improvement Lumarsoft posted stands (mirrors the API's `ImprovementStatus`). */
export type ImprovementStatus = "PLANNED" | "IN_PROGRESS" | "RELEASED";

/** What Lumarsoft did with a club's suggestion (mirrors `ImprovementSuggestionStatus`). */
export type ImprovementSuggestionStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "PLANNED"
  | "DONE"
  | "DECLINED";

/** `GET /improvements`: a published improvement, the same for every club. */
export interface Improvement {
  id: string;
  title: string;
  body: string;
  status: ImprovementStatus;
  publishedAt: string;
}

/** `GET /improvements/suggestions`: one of the club's own suggestions. */
export interface ImprovementSuggestion {
  id: string;
  title: string;
  body: string;
  status: ImprovementSuggestionStatus;
  /** Lumarsoft's answer; null = not answered yet. */
  opsReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  /** Who proposed it; null once that user is gone. */
  authorName: string | null;
  /** The published improvement that answers it. */
  improvement: { id: string; title: string; status: ImprovementStatus } | null;
}

export interface CreateImprovementSuggestionRequest {
  title: string;
  body: string;
}

/** `GET /ops/improvements`: drafts included (`publishedAt` null). */
export interface OpsImprovement {
  id: string;
  title: string;
  body: string;
  status: ImprovementStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  suggestionCount: number;
}

export interface SaveImprovementPayload {
  title?: string;
  body?: string;
  status?: ImprovementStatus;
  /** true publishes it; false takes it back to draft. */
  published?: boolean;
}

/** `GET /ops/improvement-suggestions`: a suggestion across clubs. */
export interface OpsImprovementSuggestion {
  id: string;
  title: string;
  body: string;
  status: ImprovementSuggestionStatus;
  opsReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  clubId: string;
  clubName: string;
  authorName: string | null;
  authorEmail: string | null;
  improvement: { id: string; title: string } | null;
}

export interface UpdateImprovementSuggestionPayload {
  status?: ImprovementSuggestionStatus;
  opsReply?: string | null;
  improvementId?: string | null;
}
