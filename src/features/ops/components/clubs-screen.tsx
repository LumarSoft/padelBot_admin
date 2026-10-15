"use client";

import { useState } from "react";
import { BuildingIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CLUB_HEALTH,
  CLUB_HEALTH_ORDER,
  SUBSCRIPTION_LABELS,
  timeAgo,
} from "@/features/ops/lib/labels";
import { useOpsClubs, useProfitability } from "@/features/ops/hooks/use-ops";
import { isPlanKey, planName } from "@/lib/plans";
import { SubscriptionDialog } from "@/features/ops/components/subscription-dialog";
import { ClubPasswordDialog } from "@/features/ops/components/club-password-dialog";
import { HelpSearchMisses } from "@/features/ops/components/help-search-misses";
import { formatCount } from "@/features/plan/lib/format";
import type { PlanUsage } from "@/types/api/clubs";
import type { ClubHealthStatus, ClubProfitRow, OpsClub } from "@/types/api/ops";

type Filter = ClubHealthStatus | "all";

export function ClubsScreen() {
  const clubs = useOpsClubs();
  // This month's money per club, from the profitability report: one more number per row.
  const profit = useProfitability();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<OpsClub | null>(null);
  const [managingPw, setManagingPw] = useState<OpsClub | null>(null);

  const all = clubs.data ?? [];
  const real = all.filter((club) => !club.isDemo);
  const counts = new Map<ClubHealthStatus, number>();
  for (const club of real) counts.set(club.health.status, (counts.get(club.health.status) ?? 0) + 1);
  // "Todos" includes the demo (last); a state filter only ever shows real clubs.
  const shown = filter === "all" ? all : real.filter((club) => club.health.status === filter);
  const profitById = new Map((profit.data?.clubs ?? []).map((row) => [row.id, row]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubes"
        description="Cómo está cada cliente y si tenés que hacer algo: lo más urgente primero."
      />

      {real.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Todos ({real.length})
          </FilterChip>
          {CLUB_HEALTH_ORDER.filter((status) => counts.has(status)).map((status) => (
            <FilterChip
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
              className={filter === status ? undefined : CLUB_HEALTH[status].className}
            >
              {CLUB_HEALTH[status].label} ({counts.get(status)})
            </FilterChip>
          ))}
        </div>
      )}

      {clubs.isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando clubes…</p>
      ) : shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((club) => (
            <ClubRow
              key={club.id}
              club={club}
              profit={profitById.get(club.id)}
              onEdit={() => setEditing(club)}
              onManagePasswords={() => setManagingPw(club)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BuildingIcon}
          title="Todavía no hay clubes"
          description="Cuando confirmás una solicitud, el club aparece acá."
        />
      )}

      <HelpSearchMisses />

      {editing && (
        <SubscriptionDialog
          club={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      {managingPw && (
        <ClubPasswordDialog
          club={managingPw}
          open
          onOpenChange={(open) => !open && setManagingPw(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : (className ?? "text-muted-foreground hover:text-foreground hover:bg-foreground/5"),
      )}
    >
      {children}
    </button>
  );
}

/** Whole pesos, the way the console reads money. */
const pesos = (cents: number) => formatPrice(Math.round(cents / 100) * 100);

function ClubRow({
  club,
  profit,
  onEdit,
  onManagePasswords,
}: {
  club: OpsClub;
  profit?: ClubProfitRow;
  onEdit: () => void;
  onManagePasswords: () => void;
}) {
  const { subscription, readiness, activity, plan, health } = club;
  const credits = plan.aiCredits;
  const creditsTotal = credits.limit;
  const creditsShare = creditsTotal ? Math.floor((credits.used * 100) / creditsTotal) : null;

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">
                {club.name}
              </h3>
              {club.isDemo ? (
                <Badge variant="outline">Demo</Badge>
              ) : (
                <Badge className={CLUB_HEALTH[health.status].className}>
                  {CLUB_HEALTH[health.status].label}
                </Badge>
              )}
              {/* An unknown key restricts nothing API-side — flag it so ops fixes it. */}
              <Badge
                variant={
                  isPlanKey(subscription.plan) ? "outline" : "destructive"
                }
              >
                {isPlanKey(subscription.plan)
                  ? planName(subscription.plan)
                  : `Plan “${subscription.plan}”`}
                {plan.grandfatheredFeatures && " · todas las funciones"}
              </Badge>
              <Badge
                variant={
                  subscription.severity === "ok" ||
                  subscription.severity === "trial"
                    ? "secondary"
                    : "destructive"
                }
              >
                {SUBSCRIPTION_LABELS[subscription.subscriptionStatus]}
                {subscription.daysLeft != null &&
                  ` · ${subscription.daysLeft} d`}
              </Badge>

            </div>

            {/* Why it's in that state, in words: what to talk about with the club. */}
            {!club.isDemo && health.reasons.length > 0 && (
              <p className="text-sm">{health.reasons.join(" · ")}</p>
            )}

            <p className="text-muted-foreground text-xs">
              {withLimit(plan.courts, "cancha")} ·{" "}
              {withLimit(plan.users, "usuario")} ·{" "}
              {readiness.paymentsConfigured ? "cobros ok" : "sin cobros"} ·{" "}
              {readiness.mpConnected ? "MP conectado" : "sin MP"} ·{" "}
              {readiness.whatsappLines > 0 ? "WhatsApp ok" : "sin WhatsApp"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onManagePasswords}>
              Contraseñas
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Suscripción
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric
            label="Reservas del bot"
            value={activity.bookingsBot}
            hint={`${activity.bookingsPanel} desde el panel`}
          />
          <Metric
            label="Señas cobradas"
            value={formatPrice(activity.depositsCents)}
            hint="últimos 30 días"
          />
          {/* At 100% the bot is paused until the club moves to a bigger plan: a sales call. */}
          <Metric
            label="Créditos de IA"
            value={
              creditsTotal === null
                ? formatCount(credits.used)
                : `${formatCount(credits.used)} / ${formatCount(creditsTotal)}`
            }
            hint={
              credits.paused
                ? "bot pausado"
                : creditsShare === null
                  ? "este mes"
                  : `${creditsShare}% este mes`
            }
            tone={
              creditsShare === null || creditsShare < 80
                ? "default"
                : creditsShare >= 100
                  ? "danger"
                  : "warning"
            }
          />
          {/* Revenue minus Meta and OpenAI, the same number as Rentabilidad. */}
          <Metric
            label="Margen del mes"
            value={profit ? pesos(profit.marginCents) : "—"}
            hint={
              !profit
                ? undefined
                : profit.revenue.totalCents === 0
                  ? "todavía no paga"
                  : `${profit.marginPercent}% de ${pesos(profit.revenue.totalCents)}`
            }
            tone={profit && profit.marginCents < 0 ? "danger" : "default"}
          />
          <Metric
            label="Último ingreso"
            value={timeAgo(activity.lastPanelLoginAt)}
            hint="al panel"
            tone={activity.dormant ? "warning" : "default"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/** "2/4 canchas" (a club over its limit reads "5/4"), or "3 canchas" when there's no limit. */
function withLimit(usage: PlanUsage, noun: string): string {
  if (usage.limit !== null) return `${usage.used}/${usage.limit} ${noun}s`;
  return `${usage.used} ${noun}${usage.used === 1 ? "" : "s"}`;
}
