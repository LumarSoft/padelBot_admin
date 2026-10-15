"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { buttonVariants } from "@/components/ui/button";
import { clubsService } from "@/services/clubs.service";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount, monthName } from "@/features/plan/lib/format";
import type { ClubPlanOverview } from "@/types/api/clubs";

/** "Usaste el 85% de tus créditos de IA de octubre (2.450 de 2.850)." */
export function creditsNoticeText(credits: ClubPlanOverview["aiCredits"], level: 80 | 100): string {
  const month = monthName(credits.month);
  const usage = `${formatCount(credits.used)} de ${formatCount(credits.available ?? 0)}`;
  if (level === 100) return `Usaste todos tus créditos de IA de ${month} (${usage}).`;
  const percent = Math.floor((credits.used * 100) / (credits.available || 1));
  return `Usaste el ${percent}% de tus créditos de IA de ${month} (${usage}).`;
}

/**
 * Tells the owner their month's credits are running out (80%) or used up (100%), counting the
 * credit packs, with the way to buy more. Closing it hides it for the month (it comes back once
 * if the credits run out); Facturación always shows the state. Never says what the bot will do,
 * because running out changes nothing for the players.
 */
export function AiCreditsBanner() {
  const { data } = usePlan();
  const queryClient = useQueryClient();
  const dismiss = useMutation({
    mutationFn: clubsService.dismissCreditsNotice,
    // Gone at once; the server remembers it for every device.
    onMutate: () =>
      queryClient.setQueryData<ClubPlanOverview>(queryKeys.clubs.plan, (old) =>
        old ? { ...old, creditsNotice: { ...old.creditsNotice, dismissed: true } } : old,
      ),
  });

  const notice = data?.creditsNotice;
  if (!data || !notice?.level || notice.dismissed) return null;
  const full = notice.level === 100;

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
        {creditsNoticeText(data.aiCredits, notice.level)}
      </span>
      <Link
        href="/panel/facturacion?comprar=1"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-7 bg-transparent")}
      >
        Comprar créditos
      </Link>
      <button
        type="button"
        onClick={() => dismiss.mutate()}
        aria-label="Cerrar aviso"
        className="ml-auto rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
