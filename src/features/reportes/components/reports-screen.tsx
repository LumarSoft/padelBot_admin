"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { statsService } from "@/services/stats.service";
import { shiftDay, todayKey } from "@/features/agenda/lib/schedule";
import type { OccupancyReport, RevenueReport } from "@/types/api/stats";

const WEEKDAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

function heatColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-600 text-white";
  if (pct >= 60) return "bg-emerald-500/80 text-white";
  if (pct >= 40) return "bg-emerald-400/60";
  if (pct >= 20) return "bg-emerald-300/40";
  if (pct > 0) return "bg-emerald-200/30";
  return "bg-muted/40 text-muted-foreground";
}

function OccupancyHeatmap({ report }: { report: OccupancyReport }) {
  const cellFor = new Map(report.cells.map((c) => [`${c.weekday}|${c.bandStart}`, c]));

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-max gap-1"
        style={{ gridTemplateColumns: `4.5rem repeat(${WEEKDAYS.length}, 4rem)` }}
      >
        <span />
        {WEEKDAYS.map((d) => (
          <span key={d.value} className="text-muted-foreground text-center text-xs font-medium">
            {d.label}
          </span>
        ))}
        {report.bandStarts.map((bandStart) => (
          <div key={bandStart} className="contents">
            <span className="text-muted-foreground pr-2 text-right text-xs tabular-nums leading-7">
              {bandStart}
            </span>
            {WEEKDAYS.map((d) => {
              const cell = cellFor.get(`${d.value}|${bandStart}`);
              if (!cell || cell.offered === 0) {
                return <span key={d.value} className="h-7 rounded bg-transparent" />;
              }
              const pct = Math.round((cell.occupied / cell.offered) * 100);
              return (
                <span
                  key={d.value}
                  title={`${d.label} ${bandStart}: ${pct}% (${cell.occupied}/${cell.offered})`}
                  className={cn(
                    "flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums",
                    heatColor(pct),
                  )}
                >
                  {pct}%
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadRevenueCsv(report: RevenueReport) {
  const header = "fecha,reservas,senas_ars,kiosco_ars,efectivo_ars,qr_ars,total_ars";
  const rows = report.days.map((d) =>
    [
      d.dateKey,
      d.bookings,
      (d.depositCents / 100).toFixed(2),
      (d.productsCents / 100).toFixed(2),
      (d.cashCents / 100).toFixed(2),
      (d.qrCents / 100).toFixed(2),
      ((d.depositCents + d.productsCents + d.cashCents + d.qrCents) / 100).toFixed(2),
    ].join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ingresos_${report.fromDateKey}_${report.toDateKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsScreen() {
  const [weeks, setWeeks] = useState("4");
  const [rangeDays, setRangeDays] = useState("30");

  const to = todayKey();
  const from = shiftDay(to, -(Number(rangeDays) - 1));

  const occupancyQuery = useQuery({
    queryKey: queryKeys.stats.occupancy(Number(weeks)),
    queryFn: () => statsService.getOccupancy(Number(weeks)),
  });
  const revenueQuery = useQuery({
    queryKey: queryKeys.stats.revenue(from, to),
    queryFn: () => statsService.getRevenue(from, to),
  });

  const revenue = revenueQuery.data;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Ocupación por día y horario</h2>
            <p className="text-muted-foreground text-sm">
              Dónde te sobran turnos (para promocionar) y dónde te faltan (para subir precios).
            </p>
          </div>
          <Select value={weeks} onValueChange={(v) => setWeeks(v ?? "4")}>
            <SelectTrigger className="w-40">
              <SelectValue>{(v) => `Últimas ${v} semanas`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {["2", "4", "8", "12"].map((w) => (
                <SelectItem key={w} value={w}>
                  Últimas {w} semanas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {occupancyQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Calculando ocupación…
          </div>
        ) : occupancyQuery.data ? (
          <OccupancyHeatmap report={occupancyQuery.data} />
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Ingresos</h2>
            <p className="text-muted-foreground text-sm">
              Señas cobradas por transferencia y consumos de kiosco, por día.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={rangeDays} onValueChange={(v) => setRangeDays(v ?? "30")}>
              <SelectTrigger className="w-36">
                <SelectValue>{(v) => `Últimos ${v} días`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {["7", "30", "90"].map((d) => (
                  <SelectItem key={d} value={d}>
                    Últimos {d} días
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!revenue || revenue.days.length === 0}
              onClick={() => revenue && downloadRevenueCsv(revenue)}
            >
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        {revenueQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Calculando ingresos…
          </div>
        ) : revenue ? (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Señas cobradas</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatPrice(revenue.totalDepositCents)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Kiosco</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatPrice(revenue.totalProductsCents)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Mostrador (efectivo + QR)</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatPrice(revenue.totalCashCents + revenue.totalQrCents)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Turnos confirmados</p>
                  <p className="text-xl font-semibold tabular-nums">{revenue.totalBookings}</p>
                </CardContent>
              </Card>
            </div>

            {revenue.days.length > 0 && (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Día</th>
                      <th className="px-3 py-2 text-right font-medium">Turnos</th>
                      <th className="px-3 py-2 text-right font-medium">Señas</th>
                      <th className="px-3 py-2 text-right font-medium">Kiosco</th>
                      <th className="px-3 py-2 text-right font-medium">Mostrador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.days.map((day) => (
                      <tr key={day.dateKey} className="border-t">
                        <td className="px-3 py-1.5 tabular-nums">{day.dateKey}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{day.bookings}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {formatPrice(day.depositCents)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {formatPrice(day.productsCents)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {formatPrice(day.cashCents + day.qrCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}
