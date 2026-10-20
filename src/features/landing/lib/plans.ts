/**
 * GTP's commercial plans, as the landing sells them. Billing is manual for now, so this is
 * the one place the prices live on the front. The API enforces each plan's limits (courts,
 * users, AI credits) and modules in `api/src/plans/lib/plans.ts`, and reads the price the
 * club pays (`priceCents`) for the ops console MRR from `PLAN_PRICE_<KEY>_CENTS` — keep all
 * three in step when a plan changes.
 *
 * Every plan is paid, and every plan starts with the same 15-day free trial (`TRIAL_DAYS` in the API).
 * During the launch the cards show the regular price struck through next to the launch price.
 */

import type { PlanKey } from "@/lib/plans";

export type { PlanKey };

export interface Plan {
  key: PlanKey;
  name: string;
  /** Monthly price the club pays, in ARS cents like every other amount in the app. */
  priceCents: number;
  /** Regular monthly price, struck through while the launch discount runs. */
  regularPriceCents: number;
  recommended?: boolean;
  /** Court limit; null = no limit. */
  courts: number | null;
  /** AI credits included per month: one per message the bot sends (Meta bills each one). */
  aiCredits: number;
  /** Staff users (panel + app); null = no limit. */
  users: number | null;
  /** Name of the plan this one builds on ("Todo lo de X, más"); null for the entry plan. */
  includesFrom: string | null;
  /** The few lines the card shows; everything else lives in the comparison table. */
  highlights: string[];
}

export const TRIAL_LABEL = "15 días gratis";

export const PLANS: Plan[] = [
  {
    key: "saque",
    name: "Saque",
    priceCents: 4_999_900,
    regularPriceCents: 9_999_900,
    courts: 2,
    aiCredits: 1_000,
    users: 2,
    includesFrom: null,
    highlights: [
      "Bot de WhatsApp con IA, 24/7",
      "Seña por MercadoPago, conciliada sola",
      "App para tu equipo (iPhone y Android)",
    ],
  },
  {
    key: "bandeja",
    name: "Bandeja",
    priceCents: 7_999_900,
    regularPriceCents: 15_999_900,
    recommended: true,
    courts: 4,
    aiCredits: 2_000,
    users: 5,
    includesFrom: "Saque",
    highlights: [
      "Confirmación de fijos por WhatsApp",
      "Kiosco con control de stock",
      "Lista de espera automática",
    ],
  },
  {
    key: "smash",
    name: "Smash",
    priceCents: 12_999_900,
    regularPriceCents: 25_999_900,
    courts: null,
    aiCredits: 3_000,
    users: null,
    includesFrom: "Bandeja",
    highlights: ["Soporte prioritario por WhatsApp", "Cargamos tus fijos y jugadores"],
  },
];

const count = new Intl.NumberFormat("es-AR");

/** 8000 → "8.000". */
export function formatCount(value: number): string {
  return count.format(value);
}

/** The largest monthly AI allowance, which the credit bars are drawn against. */
export const MAX_AI_CREDITS = Math.max(...PLANS.map((plan) => plan.aiCredits));

/** true/false = included or not; a string = the plan's own value (a limit, "0%", …). */
export type PlanCell = boolean | string;

/** One comparison cell per plan, in PLANS order. */
function perPlan(pick: (plan: Plan) => PlanCell): [PlanCell, PlanCell, PlanCell] {
  const [saque, bandeja, smash] = PLANS;
  return [pick(saque), pick(bandeja), pick(smash)];
}

const limitCell = (limit: number | null) => (limit === null ? "Sin límite" : `Hasta ${limit}`);

export interface ComparisonGroup {
  title: string;
  /** Each row's cells follow the order of PLANS. */
  rows: { feature: string; cells: [PlanCell, PlanCell, PlanCell] }[];
}

export const COMPARISON: ComparisonGroup[] = [
  {
    title: "El bot de WhatsApp",
    rows: [
      { feature: "Atiende 24/7 con tu número de siempre", cells: [true, true, true] },
      { feature: "Entiende audios y lee comprobantes", cells: [true, true, true] },
      { feature: "Créditos de IA por mes", cells: perPlan((plan) => formatCount(plan.aiCredits)) },
      { feature: "Responde lo de tu club: servicios, reglas, cómo llegar", cells: [true, true, true] },
      { feature: "Recordatorio antes de cada turno", cells: [true, true, true] },
      { feature: "Confirmación de turnos fijos", cells: [false, true, true] },
      { feature: "Lista de espera", cells: [false, true, true] },
    ],
  },
  {
    title: "Cobros",
    rows: [
      { feature: "Seña por MercadoPago, conciliada sola", cells: [true, true, true] },
      { feature: "Seña, pago total o sin seña: vos elegís", cells: [true, true, true] },
      { feature: "Comisión por reserva", cells: ["0%", "0%", "0%"] },
      { feature: "Cobro dividido entre jugadores", cells: [false, true, true] },
    ],
  },
  {
    title: "Panel y app",
    rows: [
      { feature: "Canchas", cells: perPlan((plan) => limitCell(plan.courts)) },
      { feature: "Agenda en vivo, reservas y turnos fijos", cells: [true, true, true] },
      { feature: "Precios por día y franja horaria", cells: [true, true, true] },
      { feature: "Jugadores con historial y ausencias", cells: [true, true, true] },
      { feature: "Reportes de recaudación", cells: [true, true, true] },
      { feature: "App para tu equipo (iPhone y Android)", cells: [true, true, true] },
      { feature: "Usuarios del equipo", cells: perPlan((plan) => plan.users?.toString() ?? "Sin límite") },
      { feature: "Kiosco con control de stock", cells: [false, true, true] },
      { feature: "Aumentos de precio programados", cells: [false, true, true] },
    ],
  },
  {
    title: "Acompañamiento",
    rows: [
      { feature: "Puesta en marcha con nosotros", cells: [true, true, true] },
      { feature: "Soporte por WhatsApp", cells: [true, true, "Prioritario"] },
      { feature: "Carga inicial de fijos y jugadores", cells: [false, false, true] },
    ],
  },
];

/** Launch discount as a whole percentage ("50% OFF"), derived so the label never lies. */
export function discountPercent(plan: Plan): number {
  return Math.round((1 - plan.priceCents / plan.regularPriceCents) * 100);
}

/** Monthly price spread over 30 days, rounded UP to the next $100 ("menos de $X por día"). */
export function dailyCeilingCents(priceCents: number): number {
  return Math.ceil(priceCents / 30 / 10_000) * 10_000;
}
