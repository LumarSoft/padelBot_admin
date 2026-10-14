/**
 * The plan keys the API stores on `Club.plan` (and on a signup request). What each plan costs
 * and includes is sold in `features/landing/lib/plans.ts`; the panel reads a club's own limits
 * and modules from the API (`GET /clubs/me/plan`), which enforces them.
 */
export const PLAN_KEYS = ["saque", "bandeja", "smash"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_NAMES: Record<PlanKey, string> = {
  saque: "Saque",
  bandeja: "Bandeja",
  smash: "Smash",
};

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && (PLAN_KEYS as readonly string[]).includes(value);
}

/** "bandeja" → "Bandeja"; an unknown key is shown as it is stored. */
export function planName(key: string): string {
  return isPlanKey(key) ? PLAN_NAMES[key] : key;
}
