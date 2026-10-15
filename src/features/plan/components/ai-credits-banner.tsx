"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount, monthName } from "@/features/plan/lib/format";

/**
 * Tells the owner their month's credits are running out (80%) or used up (100%), counting the
 * credit packs they bought, with the way to buy more. Only a heads-up: it never says what the
 * bot will do, because running out changes nothing for the players.
 */
export function AiCreditsBanner() {
  const { data } = usePlan();
  const credits = data?.aiCredits;
  if (!credits || !credits.available) return null;
  const percent = Math.floor((credits.used * 100) / credits.available);
  if (percent < 80) return null;

  const month = monthName(credits.month);
  const usage = `${formatCount(credits.used)} de ${formatCount(credits.available)}`;
  const full = percent >= 100;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2 text-sm md:px-6",
        full
          ? "bg-red-500/10 text-red-900 dark:text-red-200"
          : "bg-amber-500/15 text-amber-900 dark:text-amber-200",
      )}
    >
      <span className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0" />
        {full
          ? `Usaste todos tus créditos de IA de ${month} (${usage}).`
          : `Usaste el ${percent}% de tus créditos de IA de ${month} (${usage}).`}
      </span>
      <Link
        href="/panel/facturacion?comprar=1"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-7 bg-transparent")}
      >
        Comprar créditos
      </Link>
    </div>
  );
}
