"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { useBusinessMetrics } from "@/features/ops/hooks/use-ops";
import { StatTile } from "@/features/ops/components/stat-tile";
import { BarSeries } from "@/features/ops/components/bar-series";

export function BusinessScreen() {
  const metrics = useBusinessMetrics();

  if (metrics.isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>;
  }
  if (!metrics.data) return null;

  const { mrrCents, clubsWithoutPrice, clubs, activation, gmvCents, bookings, series } =
    metrics.data;

  const activationRate = activation.provisioned
    ? Math.round((activation.activated / activation.provisioned) * 100)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negocio"
        description="Lo que entra, lo que se activa y lo que el bot mueve. Últimos 30 días."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="MRR"
          value={formatPrice(mrrCents)}
          hint={
            clubsWithoutPrice > 0
              ? `${clubsWithoutPrice} club${clubsWithoutPrice === 1 ? "" : "es"} sin precio de plan configurado`
              : `${clubs.active} club${clubs.active === 1 ? "" : "es"} pagando`
          }
          tone={clubsWithoutPrice > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Clubes"
          value={clubs.total}
          hint={`${clubs.active} activos · ${clubs.trial} en prueba · ${clubs.pastDue} vencidos`}
        />
        <StatTile
          label="Activación"
          value={activationRate != null ? `${activationRate}%` : "—"}
          hint="Llegaron a su primera reserva real del bot en 7 días"
          tone={activationRate != null && activationRate < 50 ? "warning" : "default"}
        />
        <StatTile
          label="Señas conciliadas"
          value={formatPrice(gmvCents)}
          hint="La plata que el sistema movió para nuestros clubes"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Reservas por día</p>
              <p className="text-muted-foreground text-xs">
                El número que vende: cuántas tomó el bot solo, contra las que
                cargó alguien a mano.
              </p>
            </div>
            <BarSeries
              points={series.map((day) => ({
                date: day.date.slice(5),
                primary: day.bot,
                secondary: day.panel,
              }))}
              primaryLabel="Bot"
              secondaryLabel="Panel"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium">Quién reserva</p>
            <div className="space-y-3">
              <Share
                label="El bot"
                value={bookings.bot}
                total={bookings.bot + bookings.panel}
                emphasis
              />
              <Share
                label="El panel (a mano)"
                value={bookings.panel}
                total={bookings.bot + bookings.panel}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Si esta barra se inclina al panel, el bot no está haciendo su
              trabajo y el club lo sabe.
            </p>

            {activation.medianDaysToFirstBooking != null && (
              <p className="border-border/60 border-t pt-3 text-xs">
                <span className="text-muted-foreground">
                  Mediana hasta la primera reserva real:{" "}
                </span>
                <span className="font-medium">
                  {activation.medianDaysToFirstBooking} días
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** A meter: one share against the whole, on the same track. */
function Share({
  label,
  value,
  total,
  emphasis = false,
}: {
  label: string;
  value: number;
  total: number;
  emphasis?: boolean;
}) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}{" "}
          <span className="text-muted-foreground text-xs">({percent}%)</span>
        </span>
      </div>
      <div className="bg-foreground/10 h-2 overflow-hidden rounded-full">
        <div
          className={emphasis ? "bg-brand h-full" : "bg-muted-foreground h-full"}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
