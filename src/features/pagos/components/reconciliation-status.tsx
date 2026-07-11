"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { paymentsService } from "@/services/payments.service";

function minutesAgo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/**
 * Live "reconciliación activa" indicator: a green dot when the payments poller ran
 * recently, red with guidance when it's down or this club's MercadoPago account is
 * failing. Makes the automatic reconciliation visible so the owner trusts it.
 */
export function ReconciliationStatus() {
  const { data } = useQuery({
    queryKey: queryKeys.payments.health,
    queryFn: paymentsService.getHealth,
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const clubBroken = data.clubConsecutiveFailures > 0;
  const ok = data.reconciliationActive && !clubBroken;
  const lastConfirm = minutesAgo(data.lastAutoConfirmationAt);

  return (
    <div className="flex items-center gap-2 text-xs" title={statusTitle(ok, lastConfirm)}>
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          ok ? "bg-emerald-500" : "bg-red-500 animate-pulse",
        )}
      />
      <span className={ok ? "text-muted-foreground" : "text-red-600 font-medium"}>
        {ok
          ? "Reconciliación automática activa"
          : clubBroken
            ? "Problema con MercadoPago — revisá la conexión en Configuración"
            : "Reconciliación automática inactiva"}
      </span>
    </div>
  );
}

function statusTitle(ok: boolean, lastConfirmMinutes: number | null): string {
  if (!ok) return "Las señas no se están confirmando automáticamente.";
  if (lastConfirmMinutes === null) return "Todavía no hubo confirmaciones automáticas.";
  return `Última confirmación automática hace ${lastConfirmMinutes} min.`;
}
