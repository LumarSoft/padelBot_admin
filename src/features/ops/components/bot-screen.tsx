"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useBotMetrics } from "@/features/ops/hooks/use-ops";
import { formatUsd } from "@/features/ops/lib/labels";
import { StatTile } from "@/features/ops/components/stat-tile";
import { BarSeries } from "@/features/ops/components/bar-series";

export function BotScreen() {
  const metrics = useBotMetrics();

  if (metrics.isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>;
  }
  if (!metrics.data) return null;

  const { funnel, byState, messages, cost } = metrics.data;

  const conversionRate = funnel.conversations
    ? Math.round((funnel.bookingsConfirmed / funnel.conversations) * 100)
    : null;
  const handoffRate = funnel.conversations
    ? Math.round((funnel.handedToHuman / funnel.conversations) * 100)
    : null;
  const closeRate = funnel.bookingsStarted
    ? Math.round((funnel.bookingsConfirmed / funnel.bookingsStarted) * 100)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bot / IA"
        description="Si el bot cierra reservas solo, y cuánto nos cuesta que lo haga. Últimos 30 días."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Conversación → reserva"
          value={conversionRate != null ? `${conversionRate}%` : "—"}
          hint={`${funnel.bookingsConfirmed} reservas de ${funnel.conversations} charlas`}
        />
        <StatTile
          label="Derivadas a humano"
          value={handoffRate != null ? `${handoffRate}%` : "—"}
          hint="La tasa de fracaso del bot: pidieron una persona"
          tone={handoffRate != null && handoffRate > 20 ? "warning" : "default"}
        />
        <StatTile
          label="Empezadas que cerraron"
          value={closeRate != null ? `${closeRate}%` : "—"}
          hint={`${funnel.bookingsStarted - funnel.bookingsConfirmed} quedaron sin pagar la seña`}
          tone={closeRate != null && closeRate < 60 ? "warning" : "default"}
        />
        <StatTile
          label="Costo por reserva"
          value={
            cost.microUsdPerConfirmedBooking != null
              ? formatUsd(cost.microUsdPerConfirmedBooking)
              : "—"
          }
          hint={`${formatUsd(cost.totalMicroUsd)} en total · ${cost.calls} llamadas a OpenAI`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Costo de OpenAI por día</p>
              <p className="text-muted-foreground text-xs">
                Nuestro único costo variable por cliente. Si esto crece más
                rápido que el MRR, el modelo de precios está mal.
              </p>
            </div>
            <BarSeries
              points={cost.series.map((day) => ({
                date: day.date.slice(5),
                primary: day.microUsd,
              }))}
              primaryLabel="Costo diario"
              format={formatUsd}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Qué nos cuesta cada club</p>
            {cost.perClub.length > 0 ? (
              <ul className="space-y-2">
                {cost.perClub.map((club) => (
                  <li
                    key={club.clubId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{club.clubName}</span>
                    <span className="tabular-nums shrink-0">
                      {formatUsd(club.microUsd)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                Todavía no hay consumo registrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Dónde se quedan las charlas</p>
              <p className="text-muted-foreground text-xs">
                El estado en que quedó cada conversación. Una pila en un paso
                del medio es un paso que confunde.
              </p>
            </div>
            <ul className="space-y-1.5">
              {byState.map((state) => (
                <li
                  key={state.state}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-xs">{state.state}</span>
                  <span className="tabular-nums">{state.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Mensajes</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span>De jugadores</span>
                <span className="tabular-nums">{messages.user}</span>
              </li>
              <li className="flex justify-between">
                <span>Del bot</span>
                <span className="tabular-nums">{messages.bot}</span>
              </li>
              <li className="flex justify-between">
                <span>De staff (a mano)</span>
                <span className="tabular-nums">{messages.admin}</span>
              </li>
            </ul>
            <p className="text-muted-foreground border-border/60 border-t pt-3 text-xs">
              Cuantos más mensajes escribe el staff a mano, menos está
              trabajando el producto que le vendimos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
