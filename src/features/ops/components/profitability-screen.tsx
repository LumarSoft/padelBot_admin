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

          <Breakdown report={report.data} />

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
            las plantillas, a {usdUnit(report.data.metaMessagePriceUsd)} cada uno.{" "}
            {report.data.taxRegime === "monotributo"
              ? "Monotributo: Meta, la IA y la comisión de MercadoPago llevan el 21% de IVA que no se recupera."
              : "Responsable inscripto: los ingresos van sin el 21% de IVA."}{" "}
            Los paquetes pierden el {decimal.format(report.data.mpFeePercent)}% de MercadoPago. El ingreso del plan usa
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

const usdFormat = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdSmall = new Intl.NumberFormat("es-AR", { maximumSignificantDigits: 2 });
const decimal = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 4 });
/**
 * Dollars the way they read best: cents for normal amounts, and the significant digits for the
 * tiny ones (an AI step costs fractions of a cent — "US$ 0,00" would hide it).
 */
const usd = (value: number) =>
  `US$ ${value > 0 && value < 0.01 ? usdSmall.format(value) : usdFormat.format(value)}`;
/** A unit price as it is (0.026 → "US$ 0,026"), never rounded to cents. */
const usdUnit = (value: number) => `US$ ${decimal.format(value)}`;
const rateFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
/** 4500000 → "4,5 M". */
const millions = (value: number) =>
  value >= 1_000_000 ? `${rateFormat.format(value / 1_000_000)} M` : formatCount(value);

/**
 * "Cómo se calcula": the month's margin step by step, with this month's real numbers — what the
 * AI did and cost, what Meta billed, how dollars became pesos, and what that leaves us.
 */
function Breakdown({ report }: { report: ProfitabilityReport }) {
  const { ai, meta, effectiveRate } = report.breakdown;
  const { totals } = report;
  const perStep = ai.steps > 0 ? ai.costUsd / ai.steps : 0;
  const quote = report.usdArs.quote === "tarjeta" ? "tarjeta" : "oficial";

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">Cómo se calcula</p>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <Step title="IA (OpenAI)">
            {formatCount(ai.steps)} pasos del bot (mensajes que tuvo que entender, audios, imágenes y
            comprobantes): {millions(ai.inputTokens)} tokens de entrada y{" "}
            {millions(ai.outputTokens)} de salida. El modelo {ai.model} cobra{" "}
            {usdUnit(ai.inputPerMTokUsd)} por millón de entrada y {usdUnit(ai.outputPerMTokUsd)} por millón
            de salida → <strong>{usd(ai.costUsd)}</strong>
            {ai.steps > 0 && ` (${usd(perStep)} por paso)`}.
            {ai.priceEstimated && (
              <span className="text-amber-600 dark:text-amber-400">
                {" "}
                Precio estimado: el modelo no tiene uno cargado (OPENAI_PRICE_INPUT_PER_MTOK y
                OPENAI_PRICE_OUTPUT_PER_MTOK).
              </span>
            )}
          </Step>
          <Step title="Meta (WhatsApp)">
            {formatCount(meta.messages)} mensajes enviados: {formatCount(meta.free)} gratis (los
            primeros 1.000 de servicio de cada número) y {formatCount(meta.paid)} pagos (servicio
            después de esos 1.000 y todas las plantillas) × {usdUnit(report.metaMessagePriceUsd)} →{" "}
            <strong>{usd(meta.costUsd)}</strong>.
          </Step>
          <Step title="Del dólar a pesos">
            Dólar {quote} {formatPrice(report.usdArs.rate * 100)}
            {report.taxRegime === "monotributo"
              ? " + 21% de IVA (monotributo: no se recupera)"
              : ""}{" "}
            = <strong>${rateFormat.format(effectiveRate)} por US$</strong>. Meta{" "}
            {pesos(totals.metaCents)} · IA {pesos(totals.aiCents)}.
          </Step>
          <Step title="Nuestra ganancia">
            Ingresos {pesos(totals.revenueCents)} (de {pesos(totals.grossRevenueCents)} cobrados
            {report.taxRegime === "inscripto" ? ", sin IVA" : ""}; los paquetes sin el{" "}
            {decimal.format(report.mpFeePercent)}% de MercadoPago) − costos {pesos(totals.costCents)} ={" "}
            <strong>
              {pesos(totals.marginCents)}
              {totals.marginPercent !== null && ` (${totals.marginPercent}%)`}
            </strong>
            .
          </Step>
        </dl>
        <p className="text-muted-foreground text-xs text-pretty">
          Los créditos del club son solo los mensajes que manda el bot; el costo de Meta cuenta
          todos, también las respuestas del staff. Todo sin la demo.
        </p>
      </CardContent>
    </Card>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs font-medium">{title}</dt>
      <dd className="text-pretty">{children}</dd>
    </div>
  );
}
