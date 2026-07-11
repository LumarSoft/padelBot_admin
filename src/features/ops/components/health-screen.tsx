"use client";

import { AlertTriangleIcon, CheckCircle2Icon, CircleAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOpsHealth } from "@/features/ops/hooks/use-ops";
import { timeAgo } from "@/features/ops/lib/labels";

export function HealthScreen() {
  const health = useOpsHealth();

  if (health.isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>;
  }
  if (!health.data) return null;

  const { poller, issues, webhookDedupRows, checkedAt } = health.data;
  const critical = issues.filter((issue) => issue.severity === "critical");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salud"
        description="Sólo lo que necesita una persona. Si está vacío, está todo bien."
        actions={
          <span className="text-muted-foreground text-xs">
            Actualizado {timeAgo(checkedAt)}
          </span>
        }
      />

      {/* The reconciliation poller: when this is down, nobody's transfers are being
          confirmed — in any club. It gets its own line, always visible. */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "size-2.5 rounded-full",
                poller.reconciliationActive && poller.consecutiveFailures === 0
                  ? "bg-emerald-500"
                  : "bg-destructive animate-pulse",
              )}
            />
            <div>
              <p className="text-sm font-medium">
                {poller.reconciliationActive
                  ? "Conciliación activa"
                  : "Conciliación detenida"}
              </p>
              <p className="text-muted-foreground text-xs">
                Última vuelta OK {timeAgo(poller.lastPollOkAt)}
                {poller.consecutiveFailures > 0 &&
                  ` · ${poller.consecutiveFailures} fallos seguidos`}
              </p>
            </div>
          </div>

          <span className="text-muted-foreground text-xs">
            {webhookDedupRows} webhooks en el registro de dedup
          </span>
        </CardContent>
      </Card>

      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <CheckCircle2Icon className="size-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">No hay nada que atender</p>
              <p className="text-muted-foreground text-sm">
                Ningún club con pagos trabados, comprobantes sin revisar ni
                jugadores esperando a una persona.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {critical.length > 0 && (
            <Badge variant="destructive">
              {critical.length} {critical.length === 1 ? "urgente" : "urgentes"}
            </Badge>
          )}

          <div className="space-y-2">
            {issues.map((issue, index) => {
              const Icon =
                issue.severity === "critical"
                  ? CircleAlertIcon
                  : AlertTriangleIcon;

              return (
                <Card
                  key={`${issue.kind}-${issue.clubId ?? index}`}
                  size="sm"
                  className={cn(
                    issue.severity === "critical" &&
                      "ring-destructive/30 ring-1",
                  )}
                >
                  <CardContent className="flex items-start gap-3">
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        issue.severity === "critical"
                          ? "text-destructive"
                          : "text-amber-500",
                      )}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm">{issue.message}</p>
                      {issue.clubName && (
                        <p className="text-muted-foreground text-xs">
                          {issue.clubName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
