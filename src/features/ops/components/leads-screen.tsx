"use client";

import { useState } from "react";
import { InboxIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/features/ops/components/stat-tile";
import { LeadCard } from "@/features/ops/components/lead-card";
import { answerLabel, LEAD_STATUS_LABELS } from "@/features/ops/lib/labels";
import { useLeads, useLeadsSummary } from "@/features/ops/hooks/use-ops";
import type { LeadStatus } from "@/types/api/ops";

const FILTERS: { value: LeadStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Nuevos" },
  { value: "CONTACTED", label: "Contactados" },
  { value: "CONVERTED", label: "Clientes" },
  { value: "LOST", label: "Perdidos" },
];

export function LeadsScreen() {
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const leads = useLeads(filter === "ALL" ? undefined : filter);
  const summary = useLeadsSummary();

  const pipeline = summary.data?.pipeline;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Todo lo que contestaron en el formulario, y en qué punto está cada uno."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Sin contactar"
          value={pipeline?.NEW ?? "—"}
          hint="Los que están esperando que los llames"
          tone={pipeline && pipeline.NEW > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Tiempo de respuesta"
          value={
            summary.data?.medianResponseHours != null
              ? `${summary.data.medianResponseHours} h`
              : "—"
          }
          hint="Mediana desde que entra el lead hasta que lo contactamos"
        />
        <StatTile
          label="Clientes"
          value={pipeline?.CONVERTED ?? "—"}
          hint={
            summary.data
              ? `de ${Object.values(summary.data.pipeline).reduce((a, b) => a + b, 0)} leads`
              : undefined
          }
        />
        <StatTile
          label="Últimos 30 días"
          value={summary.data?.last30Days ?? "—"}
          hint="Leads nuevos en el último mes"
        />
      </div>

      {/* What actually brings clubs in, and what they say hurts. This is what should
          decide where the next month of sales effort goes. */}
      {summary.data && summary.data.byChannel.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card size="sm">
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">Por dónde nos encuentran</p>
              <ul className="space-y-1.5">
                {summary.data.byChannel.map((channel) => (
                  <li
                    key={channel.value}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{answerLabel(channel.value)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {channel.converted} de {channel.leads} cerraron
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {summary.data.byPain.length > 0 && (
            <Card size="sm">
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">Qué les duele</p>
                <ul className="space-y-1.5">
                  {summary.data.byPain.map((pain) => (
                    <li
                      key={pain.value}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{answerLabel(pain.value)}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {pain.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            {option.value !== "ALL" && pipeline
              ? ` (${pipeline[option.value]})`
              : ""}
          </Button>
        ))}
      </div>

      {leads.isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando leads…</p>
      ) : leads.data && leads.data.length > 0 ? (
        <div className="space-y-4">
          {leads.data.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={InboxIcon}
          title="No hay leads acá"
          description={
            filter === "ALL"
              ? "Cuando alguien complete el formulario de /register, aparece en esta pantalla."
              : `Ningún lead en estado "${LEAD_STATUS_LABELS[filter as LeadStatus]}".`
          }
        />
      )}
    </div>
  );
}
