import { formatDayLabel } from "@/features/agenda/lib/schedule";
import type {
  CategoryFormat,
  CompetitionKind,
  CompetitionPair,
  CompetitionSession,
  CompetitionStatus,
  MatchFormat,
  PaymentMethod,
  SetScore,
} from "@/types/api/competitions";

export const KIND_LABEL: Record<CompetitionKind, { one: string; many: string; path: string }> = {
  TOURNAMENT: { one: "Torneo", many: "Torneos", path: "/panel/torneos" },
  PENA: { one: "Peña", many: "Peñas", path: "/panel/penas" },
};

export const STATUS_LABEL: Record<CompetitionStatus, string> = {
  OPEN: "Inscripción abierta",
  IN_PROGRESS: "En juego",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

export const MATCH_FORMAT_LABEL: Record<MatchFormat, string> = {
  ONE_SET: "Americano (1 set)",
  BEST_OF_THREE: "Completo (al mejor de 3)",
};

export const CATEGORY_FORMAT_LABEL: Record<CategoryFormat, string> = {
  GROUPS_KNOCKOUT: "Zonas y cuadro",
  KNOCKOUT: "Solo cuadro",
  ROUND_ROBIN: "Todos contra todos",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  QR: "QR",
  TRANSFER: "Transferencia",
};

/** "Juan Pérez / Lucas Gómez". */
export function pairName(pair: Pick<CompetitionPair, "players"> | undefined): string {
  if (!pair) return "A definir";
  return pair.players.map((p) => p.name).join(" / ");
}

/** "sábado 17 de octubre · 20:00 a 23:00". */
export function sessionLabel(session: Pick<CompetitionSession, "dateKey" | "startTime" | "endTime">): string {
  return `${formatDayLabel(session.dateKey)} · ${session.startTime} a ${session.endTime}`;
}

/** "6-4 3-6 10-8". */
export function scoreLabel(sets: SetScore[] | null): string {
  return sets ? sets.map(([a, b]) => `${a}-${b}`).join(" ") : "";
}

/** Knockout round name counted back from the final (same rule as the API). */
export function roundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return "Final";
  if (fromFinal === 1) return "Semifinal";
  if (fromFinal === 2) return "Cuartos de final";
  if (fromFinal === 3) return "Octavos de final";
  return `Ronda ${round}`;
}

/** Pesos typed by the desk → cents. Empty or invalid reads as 0. */
export function pesosToCents(value: string): number {
  const pesos = Number(value.replace(",", "."));
  return Number.isFinite(pesos) && pesos > 0 ? Math.round(pesos * 100) : 0;
}

/** "recién", "hace 5 min", "hace 2 h", "hace 3 días" — how long a request has been waiting. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

/** Groups items by a key, keeping first-seen order. */
export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return [...groups.entries()];
}
