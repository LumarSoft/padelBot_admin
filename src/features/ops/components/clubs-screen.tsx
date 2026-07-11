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
import { formatUsd, SUBSCRIPTION_LABELS, timeAgo } from "@/features/ops/lib/labels";
import { useOpsClubs } from "@/features/ops/hooks/use-ops";
import { SubscriptionDialog } from "@/features/ops/components/subscription-dialog";
import type { OpsClub } from "@/types/api/ops";

export function ClubsScreen() {
  const clubs = useOpsClubs();
  const [editing, setEditing] = useState<OpsClub | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubes"
        description="Cada cliente, su suscripción, si puede tomar una reserva y si sigue usando el panel."
      />

      {clubs.isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando clubes…</p>
      ) : clubs.data && clubs.data.length > 0 ? (
        <div className="space-y-3">
          {clubs.data.map((club) => (
            <ClubRow key={club.id} club={club} onEdit={() => setEditing(club)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BuildingIcon}
          title="Todavía no hay clubes"
          description="Cuando provisiones un lead, el club aparece acá."
        />
      )}

      {editing && (
        <SubscriptionDialog
          club={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function ClubRow({ club, onEdit }: { club: OpsClub; onEdit: () => void }) {
  const { subscription, readiness, activity } = club;

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">
                {club.name}
              </h3>
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

              {/* The one flag that matters most: a club that can't take a booking is
                  not a customer yet, whatever its subscription says. */}
              {!readiness.ready && (
                <Badge variant="destructive">No puede reservar</Badge>
              )}
              {activity.dormant && (
                <Badge variant="outline">Sin entrar al panel</Badge>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              {readiness.courts} cancha{readiness.courts === 1 ? "" : "s"} ·{" "}
              {readiness.paymentsConfigured ? "cobros ok" : "sin cobros"} ·{" "}
              {readiness.mpConnected ? "MP conectado" : "sin MP"} ·{" "}
              {readiness.whatsappLines > 0 ? "WhatsApp ok" : "sin WhatsApp"}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onEdit}>
            Suscripción
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <Metric
            label="Nos cuesta"
            value={formatUsd(club.llmCostMicroUsd)}
            hint="OpenAI, 30 días"
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
  tone?: "default" | "warning";
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
