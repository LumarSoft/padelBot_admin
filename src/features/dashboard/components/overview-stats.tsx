"use client";

import {
  Bot,
  CalendarCheck,
  CalendarDays,
  Loader2,
  MessagesSquare,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOverviewStats } from "@/features/dashboard/hooks/use-stats";
import type { OverviewStats, StatsSeriesPoint } from "@/types/api/stats";

const HEADLINE = [
  { key: "turnosHoy", label: "Turnos hoy", icon: CalendarDays },
  { key: "reservasActivas", label: "Reservas activas", icon: CalendarCheck },
  { key: "chatsActivos", label: "Chats activos (24h)", icon: MessagesSquare },
  { key: "pendientesPago", label: "Esperando seña", icon: Wallet },
] as const;

/** "YYYY-MM-DD" → "DD/MM". */
function shortDay(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-muted-foreground flex items-center justify-between">
          <p className="text-sm">{label}</p>
          <Icon className="size-4" />
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function BookingsChart({ series }: { series: StatsSeriesPoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.count));
  const total = series.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-medium">Reservas de los últimos 14 días</p>
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "reserva" : "reservas"} en el período.
            </p>
          </div>
        </div>

        <div className="flex h-36 items-end gap-1.5">
          {series.map((point) => {
            const heightPct = (point.count / max) * 100;
            return (
              <div
                key={point.date}
                className="group/bar flex flex-1 flex-col items-center justify-end gap-1"
                title={`${shortDay(point.date)}: ${point.count}`}
              >
                <span className="text-muted-foreground text-[10px] tabular-nums opacity-0 transition-opacity group-hover/bar:opacity-100">
                  {point.count}
                </span>
                <div
                  className="bg-brand/80 group-hover/bar:bg-brand w-full rounded-t-sm transition-colors"
                  style={{ height: `${Math.max(heightPct, point.count > 0 ? 6 : 2)}%` }}
                />
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {shortDay(point.date).slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BotImpactCard({ stats }: { stats: OverviewStats }) {
  const total = stats.reservasBot + stats.reservasPanel;
  const botPct = total > 0 ? Math.round((stats.reservasBot / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Bot className="size-5" />
          </div>
          <div>
            <p className="font-medium">Lo que resolvió el bot</p>
            <p className="text-muted-foreground text-sm">Últimos 14 días</p>
          </div>
        </div>

        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {botPct}%
          </p>
          <p className="text-muted-foreground text-sm">
            de las reservas las tomó el bot solo
            {total > 0 ? ` (${stats.reservasBot} de ${total})` : ""}.
          </p>
        </div>

        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn("bg-brand h-full rounded-full transition-all")}
            style={{ width: `${botPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-muted-foreground text-sm">Señas cobradas en el período</p>
          <p className="font-semibold tabular-nums">{formatPrice(stats.ingresosCents)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewStats() {
  const statsQuery = useOverviewStats();

  if (statsQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando métricas…
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-5 text-sm">
          No pudimos cargar las métricas. Probá recargar la página.
        </CardContent>
      </Card>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HEADLINE.map(({ key, label, icon }) => (
          <StatCard key={key} label={label} value={stats[key]} icon={icon} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BookingsChart series={stats.series} />
        </div>
        <BotImpactCard stats={stats} />
      </div>
    </div>
  );
}
