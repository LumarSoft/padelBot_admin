"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount, monthName } from "@/features/plan/lib/format";

/**
 * Tells the owner their month's AI credits are running out (80%) or used up (100%). Only a
 * heads-up: it never says what the bot will do, because going over changes nothing today.
 */
export function AiCreditsBanner() {
  const { data } = usePlan();
  const credits = data?.aiCredits;
  if (!credits || credits.limit === null || credits.percent === null || credits.percent < 80) {
    return null;
  }

  const month = monthName(credits.month);
  const usage = `${formatCount(credits.used)} de ${formatCount(credits.limit)}`;
  const full = credits.percent >= 100;

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-sm md:px-6",
        full
          ? "bg-red-500/10 text-red-900 dark:text-red-200"
          : "bg-amber-500/15 text-amber-900 dark:text-amber-200",
      )}
    >
      <Sparkles className="size-4 shrink-0" />
      <span>
        {full
          ? `Usaste todos los créditos de IA de ${month} (${usage}).`
          : `Usaste el ${credits.percent}% de los créditos de IA de ${month} (${usage}).`}{" "}
        <Link
          href="/panel/configuracion?tab=complejo"
          className="font-medium underline underline-offset-2"
        >
          Ver tu plan
        </Link>{" "}
        o{" "}
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          escribinos para pasar a uno con más créditos
        </a>
        .
      </span>
    </div>
  );
}
