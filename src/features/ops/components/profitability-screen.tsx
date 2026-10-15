"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { formatCount, monthName } from "@/features/plan/lib/format";
import { StatTile } from "@/features/ops/components/stat-tile";
import { useProfitability } from "@/features/ops/hooks/use-ops";
import type { ClubProfitRow, MarginFlag, ProfitabilityReport } from "@/types/api/ops";

/** "2026-10" for this month and the five before it. */
function lastMonths(count = 6): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

const FLAG_LABEL: Record<Exclude<MarginFlag, null>, string> = {
  negative: "Pierde",
  low: "Margen bajo",
  noRevenue: "Sin ingreso",
};

/** Whole pesos, the way the console reads money ("$12.345"). */
const pesos = (cents: number) => formatPrice(Math.round(cents / 100) * 100);

/**
 * Rentabilidad: per club and month, what it pays us against what serving it costs (Meta's
 * WhatsApp messages and OpenAI). Totals on top, the clubs that lose money or barely earn first.
 */
export function ProfitabilityScreen() {
  const months = lastMonths();
  const [month, setMonth] = useState(months[0]);
  const report = useProfitability(month);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rentabilidad"
        description="Lo que paga cada club contra lo que nos cuesta atenderlo: mensajes de Meta e IA."
      />

      <div className="flex flex-wrap gap-2">
        {months.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMonth(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              key === month
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
            )}
          >
            {monthName(key)}
          </button>
        ))}
      </div>

      {report.isLoading || !report.data ? (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Ingresos netos"
              value={pesos(report.data.totals.revenueCents)}
              hint={
                report.data.taxRegime === "inscripto"
                  ? `De ${pesos(report.data.totals.grossRevenueCents)} cobrados, sin IVA ni comisión de MercadoPago`
                  : `De ${pesos(report.data.totals.grossRevenueCents)} cobrados, sin la comisión de MercadoPago`
              }
            />
            <StatTile
              label="Costos"
              value={pesos(report.data.totals.costCents)}
              hint={`Meta ${pesos(report.data.totals.metaCents)} · IA ${pesos(report.data.totals.aiCents)}`}
            />
            <StatTile
              label="Margen"
              value={pesos(report.data.totals.marginCents)}
              hint={
                report.data.totals.marginPercent !== null
                  ? `${report.data.totals.marginPercent}% de lo que entra`
                  : "Sin ingresos este mes"
              }
              tone={report.data.totals.marginCents < 0 ? "danger" : "default"}
            />
            <StatTile
              label="Mensajes"
              value={formatCount(report.data.totals.messages.total)}
              hint={`${formatCount(report.data.totals.messages.paid)} pagos · ${formatCount(report.data.totals.messages.free)} gratis`}
            />
          </div>

          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Club</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                    <TableHead className="text-right">Mensajes</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">IA</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="pr-4 text-right">Créditos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.data.clubs.map((club) => (
                    <ClubRow key={club.id} club={club} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <DollarNote usdArs={report.data.usdArs} />
          <p className="text-muted-foreground text-xs text-pretty">
            Meta: los mensajes de servicio después de los primeros 1.000 de cada número, más todas
            las plantillas, a US$ {report.data.metaMessagePriceUsd} cada uno.{" "}
            {report.data.taxRegime === "monotributo"
              ? "Monotributo: Meta, la IA y la comisión de MercadoPago llevan el 21% de IVA que no se recupera."
              : "Responsable inscripto: los ingresos van sin el 21% de IVA."}{" "}
            Los paquetes pierden el {report.data.mpFeePercent}% de MercadoPago. El ingreso del plan usa
            el plan y el estado de hoy de cada club; la demo no suma en los totales.
          </p>
        </>
      )}
    </div>
  );
}

function ClubRow({ club }: { club: ClubProfitRow }) {
  const tone =
    club.flag === "negative"
      ? "bg-red-500/[0.06]"
      : club.flag === "low"
        ? "bg-amber-500/[0.07]"
        : undefined;
  const overCredits = club.credits.included !== null && club.credits.used > club.credits.included;

  return (
    <TableRow className={cn(tone, club.isDemo && "opacity-60")}>
      <TableCell className="pl-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{club.name}</span>
          {club.isDemo && <Badge variant="outline">Demo</Badge>}
          {club.flag && (
            <Badge variant={club.flag === "negative" ? "destructive" : "secondary"}>
              {FLAG_LABEL[club.flag]}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{club.plan}</p>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {pesos(club.revenue.totalCents)}
        {club.revenue.packsCents > 0 && (
          <p className="text-muted-foreground text-xs">
            {pesos(club.revenue.packsCents)} en paquetes
          </p>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCount(club.messages.total)}
        <p className="text-muted-foreground text-xs">{formatCount(club.messages.paid)} pagos</p>
      </TableCell>
      <TableCell className="text-right tabular-nums">{pesos(club.cost.metaCents)}</TableCell>
      <TableCell className="text-right tabular-nums">{pesos(club.cost.aiCents)}</TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          club.marginCents < 0 && "text-red-600 dark:text-red-400",
        )}
      >
        {pesos(club.marginCents)}
        {club.marginPercent !== null && (
          <p className="text-muted-foreground text-xs font-normal">{club.marginPercent}%</p>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "pr-4 text-right tabular-nums",
          overCredits && "text-amber-600 dark:text-amber-400",
        )}
      >
        {formatCount(club.credits.used)}
        {club.credits.included !== null && ` / ${formatCount(club.credits.included)}`}
      </TableCell>
    </TableRow>
  );
}

/** Which dollar the costs used, and a warning when it isn't a fresh fetched one. */
function DollarNote({ usdArs }: { usdArs: ProfitabilityReport["usdArs"] }) {
  const stale = usdArs.stale;
  const quote = usdArs.quote === "tarjeta" ? "tarjeta" : "oficial";
  return (
    <p
      className={cn(
        "text-xs text-pretty",
        stale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      )}
    >
      Dólar {quote} a {formatPrice(usdArs.rate * 100)}
      {usdArs.source === "dolarapi" && usdArs.dateKey
        ? ` (dolarapi.com, ${usdArs.dateKey.split("-").reverse().join("/")}; se actualiza solo todos los días${stale ? ", pero hace días que no se puede traer" : ""})`
        : usdArs.source === "config"
          ? " (USD_ARS_RATE: todavía no se pudo traer de dolarapi.com)"
          : " (valor de respaldo: todavía no se pudo traer de dolarapi.com)"}
      .
    </p>
  );
}
