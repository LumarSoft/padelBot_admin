"use client";

import { Info } from "lucide-react";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { hasRoom, usePlan } from "@/features/plan/hooks/use-plan";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const COPY = {
  courts: {
    includes: (limit: number) => `hasta ${plural(limit, "cancha")}`,
    has: (used: number) => plural(used, "cancha"),
    toAddMore: "Para sumar otra,",
  },
  users: {
    includes: (limit: number) => `${plural(limit, "usuario")} activos, con vos incluido,`,
    has: (used: number) => `${used} activos`,
    toAddMore: "Para sumar a alguien, desactivá a quien ya no use el panel o",
  },
} as const;

/**
 * Says the plan is full before the owner hits the refusal. Nothing the club has is touched:
 * a club over its limit (moved down a plan) keeps everything and only can't add one more.
 */
export function PlanLimitNotice({ resource }: { resource: "courts" | "users" }) {
  const { data } = usePlan();
  const usage = data?.[resource];
  if (!data || !usage || usage.limit === null || hasRoom(usage)) return null;

  const copy = COPY[resource];
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        Tu plan {data.plan.name} incluye {copy.includes(usage.limit)} y tenés{" "}
        {copy.has(usage.used)}. {copy.toAddMore}{" "}
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          escribinos para cambiar de plan
        </a>
        .
      </span>
    </p>
  );
}
