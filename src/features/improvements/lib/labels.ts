import type {
  ImprovementStatus,
  ImprovementSuggestionStatus,
} from "@/types/api/improvements";

interface StatusLabel {
  label: string;
  /** Tailwind classes for the status pill. */
  tone: string;
}

const SKY = "bg-sky-500/10 text-sky-700 dark:text-sky-300";
const AMBER = "bg-amber-500/10 text-amber-700 dark:text-amber-300";
const EMERALD = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
const MUTED = "bg-muted text-muted-foreground";

export const IMPROVEMENT_STATUS: Record<ImprovementStatus, StatusLabel> = {
  PLANNED: { label: "Planeada", tone: SKY },
  IN_PROGRESS: { label: "En desarrollo", tone: AMBER },
  RELEASED: { label: "Lanzada", tone: EMERALD },
};

export const SUGGESTION_STATUS: Record<ImprovementSuggestionStatus, StatusLabel> = {
  NEW: { label: "Enviada", tone: MUTED },
  UNDER_REVIEW: { label: "La estamos viendo", tone: SKY },
  PLANNED: { label: "Planeada", tone: AMBER },
  DONE: { label: "Hecha", tone: EMERALD },
  DECLINED: { label: "Por ahora no", tone: MUTED },
};

export const IMPROVEMENT_STATUSES: ImprovementStatus[] = ["RELEASED", "IN_PROGRESS", "PLANNED"];

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** ISO date → "15 oct 2026". */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}
