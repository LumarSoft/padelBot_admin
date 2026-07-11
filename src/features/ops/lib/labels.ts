import type { LeadStatus } from "@/types/api/ops";

/**
 * Spanish for the signup's coded answers. The API stores them as constants
 * (`INSTAGRAM`, `REPLYING`…) so we can reword the question without a migration — this is
 * where the wording lives on the reading end. Mirrors `api/src/onboarding/lib/signup-answers.ts`.
 */
const ANSWER_LABELS: Record<string, string> = {
  INDOOR: "Techadas",
  OUTDOOR: "Al aire libre",
  MIXED: "Mixtas",

  ALWAYS: "Siempre cobra seña",
  SOMETIMES: "A veces cobra seña",
  NEVER: "No cobra seña",

  YES: "Sí",
  NO: "No",
  UNSURE: "No sabe",

  PAPER: "Cuaderno / papel",
  WHATSAPP: "WhatsApp a mano",
  SPREADSHEET: "Excel / planilla",
  SOFTWARE: "Otro software",

  REPLYING: "Contestar WhatsApp todo el día",
  DEPOSITS: "Perseguir las señas",
  CHANGES: "Cambios y cancelaciones",
  FIXED_SLOTS: "Manejar los turnos fijos",
  OTHER: "Otra cosa",

  NONE: "Ninguno",
  FEW: "1 a 10",
  SOME: "11 a 25",
  MANY: "Más de 25",

  INSTAGRAM: "Instagram",
  REFERRAL: "Recomendación",
  GOOGLE: "Google",
  OTHER_CLUB: "Otro club",
  UNKNOWN: "No respondió",

  MORNING: "Mañana (9–13)",
  AFTERNOON: "Tarde (13–19)",
  EVENING: "Noche (19–22)",
  CUSTOM: "Horario puntual",
  ANY: "Cualquier momento",
};

export function answerLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return ANSWER_LABELS[value] ?? value;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  CONVERTED: "Cliente",
  LOST: "Perdido",
};

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  TRIAL: "Prueba",
  ACTIVE: "Activo",
  PAST_DUE: "Vencido",
  CANCELLED: "Cancelado",
};

/** Micro-USD → "$1,23". The bot's cost is small enough that cents alone would read as 0. */
export function formatUsd(microUsd: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(microUsd / 1_000_000);
}

/** ISO → "hace 3 días" / "hace 2 h". Null → "nunca". */
export function timeAgo(iso: string | null): string {
  if (!iso) return "nunca";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}
