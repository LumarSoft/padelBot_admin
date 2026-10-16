"use client";

import Link from "next/link";
import { Pause, Sparkles, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { buttonVariants } from "@/components/ui/button";
import { clubsService } from "@/services/clubs.service";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount, monthName } from "@/features/plan/lib/format";
import type { ClubPlanOverview, CreditsNoticeLevel } from "@/types/api/clubs";

/**
 * "Te queda el 15% de tus créditos de IA de octubre (850 de 1.000)…", or that the bot is paused.
 * The staff can't change the plan, so their version only says how to keep the players answered.
 */
export function creditsNoticeText(
  credits: ClubPlanOverview["aiCredits"],
  level: CreditsNoticeLevel,
  isOwner = true,
): string {
  const month = monthName(credits.month);
  const usage = `${formatCount(credits.used)} de ${formatCount(credits.limit ?? 0)}`;
  if (credits.paused) {
    return isOwner
      ? `El bot está pausado: se terminaron tus créditos de IA de ${month} (${usage}). Cambiá de plan para que vuelva a atender; mientras tanto, respondé a los jugadores desde la sección WhatsApp del panel.`
      : `El bot está pausado: se terminaron los créditos de IA de ${month}. Respondé a los jugadores desde la sección WhatsApp del panel.`;
  }
  if (level === 100) return `Usaste todos tus créditos de IA de ${month} (${usage}).`;
  const left = Math.max(0, 100 - (credits.percent ?? 0));
  return `Te queda el ${left}% de tus créditos de IA de ${month} (${usage}). Si se terminan, el bot se pausa hasta que cambies de plan.`;
}

/**
 * Warns when the month's plan credits run low (20%, 10% and 5% left) and when they run out and
 * the bot pauses. The owner gets the way to a bigger plan and can close each warning (the next
 * level shows again); while the bot is paused it can't be closed, and the staff sees it too,
 * since they're the ones answering the players by hand. Facturación always shows the state.
 */
export function AiCreditsBanner({ isOwner }: { isOwner: boolean }) {
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
  const paused = data.aiCredits.paused;
  if (!isOwner && !paused) return null;
  const Icon = paused ? Pause : Sparkles;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2 text-sm md:px-6",
        paused || notice.level === 100
          ? "bg-red-500/10 text-red-900 dark:text-red-200"
          : "bg-amber-500/15 text-amber-900 dark:text-amber-200",
      )}
    >
      <span className="flex items-center gap-2 text-pretty">
        <Icon className="size-4 shrink-0" />
        {creditsNoticeText(data.aiCredits, notice.level, isOwner)}
      </span>
      {isOwner ? (
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-7 bg-transparent")}
        >
          Cambiar plan
        </a>
      ) : (
        <Link
          href="/panel/conversaciones"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-7 bg-transparent")}
        >
          Ir a WhatsApp
        </Link>
      )}
      {!paused && (
        <button
          type="button"
          onClick={() => dismiss.mutate()}
          aria-label="Cerrar aviso"
          className="ml-auto rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
