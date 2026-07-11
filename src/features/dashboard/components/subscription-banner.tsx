"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { clubsService } from "@/services/clubs.service";
import { lumarsoftWhatsApp } from "@/lib/contact";

/**
 * Soft subscription guard for the panel: an informative banner during the trial,
 * a nagging one when past due / in grace, and a red one when the bot is already
 * answering the fallback message. The panel itself is never blocked.
 */
export function SubscriptionBanner() {
  const { data } = useQuery({
    queryKey: queryKeys.clubs.subscription,
    queryFn: clubsService.getSubscription,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  if (!data || data.severity === "ok") return null;
  // Unlimited trial (legacy clubs): nothing to nag about.
  if (data.severity === "trial" && data.daysLeft === null) return null;

  const message =
    data.severity === "trial"
      ? data.daysLeft === 0
        ? "Tu prueba gratis termina hoy."
        : `Te quedan ${data.daysLeft} día${data.daysLeft === 1 ? "" : "s"} de prueba gratis.`
      : data.severity === "warning"
        ? data.daysLeft !== null
          ? `Tu suscripción está vencida — el bot deja de atender en ${data.daysLeft} día${data.daysLeft === 1 ? "" : "s"}.`
          : "Tu suscripción está vencida."
        : "Tu suscripción está inactiva y el bot dejó de tomar reservas.";

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-sm md:px-6",
        data.severity === "trial" && "bg-brand/10 text-foreground",
        data.severity === "warning" && "bg-amber-500/15 text-amber-900 dark:text-amber-200",
        data.severity === "blocked" && "bg-red-500/15 text-red-900 dark:text-red-200",
      )}
    >
      {data.severity === "trial" ? (
        <Clock className="size-4 shrink-0" />
      ) : (
        <AlertTriangle className="size-4 shrink-0" />
      )}
      <span>
        {message}{" "}
        <a
          href={lumarsoftWhatsApp("hire")}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          Activala hablando con nosotros
        </a>
        .
      </span>
    </div>
  );
}
