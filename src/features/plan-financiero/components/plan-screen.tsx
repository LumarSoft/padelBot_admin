"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/features/ops/components/stat-tile";
import { cn } from "@/lib/utils";
import modeloBase from "@/features/plan-financiero/data/modelo-financiero.json";
import type { ModeloFinanciero, Periodo, PlanKey } from "@/features/plan-financiero/lib/types";
import { PLANES, RUBROS } from "@/features/plan-financiero/lib/types";
import {
  acumulado,
  altasPorLocalidad,
  anioDelMes,
  cierreDelPeriodo,
  clientesEn,
  descontado,
  equilibrioEn,
  flujoNetoUsd,
  formatoPlazo,
  indicadores,
  ingresosEn,
  mesSas,
  penetracion,
  resumenPeriodo,
  van,
} from "@/features/plan-financiero/lib/metrics";
import { ImportError, modeloDesdeArchivo } from "@/features/plan-financiero/lib/import";
import { Donut, HBars, Legend, TimeChart, Waterfall } from "@/features/plan-financiero/components/charts";
import { AnnualMatrix } from "@/features/plan-financiero/components/annual-matrix";

const BASE = modeloBase as ModeloFinanciero;

export const PLAN_COLOR: Record<PlanKey, string> = {
  basico: "var(--viz-1)",
  intermedio: "var(--viz-2)",
  full: "var(--viz-3)",
};

const usd0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const pct1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
export const fmtUsd = (v: number) => `${v < 0 ? "−" : ""}USD ${usd0.format(Math.abs(Math.round(v)))}`;
export const fmtArsM = (v: number) =>
  `${v < 0 ? "−" : ""}ARS ${pct1.format(Math.abs(v) / 1_000_000)} M`;
const fmtPct = (v: number) => `${pct1.format(v)} %`;
/** Axis ticks keep one decimal so 2,5 k is never printed as 3 k. */
const axis1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const axisUsd = (v: number) => (Math.abs(v) >= 1000 ? `${axis1.format(v / 1000)} k` : usd0.format(v));
const axisArs = (v: number) => `${axis1.format(v / 1_000_000)} M`;

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "todo", label: "36 meses" },
  { key: 2027, label: "2027" },
  { key: 2028, label: "2028" },
  { key: 2029, label: "2029" },
];

/**
 * «Plan financiero»: the business plan's point 8 as a BI board. One row of slicers scopes
 * every tile and chart below it (scenario, period, plan, discount rate); clicking a
 * scenario bar, a plan slice or a month filters the board too. The data is the model
 * workbook's «Datos_BI» sheet — bundled, or loaded again from the .xlsx with one button.
 */
export function PlanScreen() {
  const [modelo, setModelo] = useState<ModeloFinanciero>(BASE);
  const [escenarioId, setEscenarioId] = useState("base");
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const [plan, setPlan] = useState<PlanKey | "todos">("todos");
  const [tasa, setTasa] = useState(BASE.tasaCorte);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const escenario = modelo.escenarios.find((e) => e.id === escenarioId) ?? modelo.escenarios[0];
  const cierre = cierreDelPeriodo(periodo);
  const meses = modelo.meses;

  const kpi = useMemo(() => indicadores(modelo, escenario, tasa), [modelo, escenario, tasa]);
  const resumen = useMemo(() => resumenPeriodo(modelo, escenario, periodo, plan), [modelo, escenario, periodo, plan]);
  const pen = useMemo(() => penetracion(modelo, escenario), [modelo, escenario]);
  const flows = useMemo(() => flujoNetoUsd(escenario, modelo.tipoCambio), [escenario, modelo.tipoCambio]);

  const planes = plan === "todos" ? PLANES : PLANES.filter((p) => p.key === plan);
  const inPeriod = (t: number) => periodo === "todo" || anioDelMes(t) === periodo;
  const penCierre = pen.find((p) => p.anio === (periodo === "todo" ? 2029 : periodo));
  const sasDesde = mesSas(escenario);
  const vanExcel = escenario.excel?.van;
  const coincideExcel =
    vanExcel != null && Math.abs(tasa - modelo.tasaCorte) < 1e-9 && Math.abs(kpi.van - vanExcel) < 1;

  async function importar(file: File) {
    setLoading(true);
    try {
      const next = await modeloDesdeArchivo(file, BASE);
      setModelo(next);
      setTasa(next.tasaCorte);
      if (!next.escenarios.some((e) => e.id === escenarioId)) setEscenarioId(next.escenarios[0].id);
      toast.success(`Modelo cargado: ${next.escenarios.length} escenarios de ${file.name}`);
    } catch (error) {
      toast.error(error instanceof ImportError ? error.message : "No pudimos leer el archivo.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="plan-bi space-y-5">
      <PageHeader
        title="Plan financiero"
        description="El punto 8 del plan de negocios como tablero: escenarios, flujo de fondos, cartera contra las metas de penetración y evaluación de la inversión."
        actions={
          <>
            {modelo !== BASE && (
              <Button variant="ghost" size="sm" onClick={() => setModelo(BASE)}>
                <RotateCcw className="size-4" /> Modelo original
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={loading} onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="size-4" />
              {loading ? "Leyendo…" : "Cargar Excel del modelo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importar(file);
              }}
            />
          </>
        }
      />

      {/* Slicers: one row, above everything they scope. */}
      <div className="glass-card ring-foreground/10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl px-4 py-3 ring-1">
        <Slicer
          label="Escenario"
          options={modelo.escenarios.map((e) => ({ key: e.id, label: e.nombre }))}
          value={escenario.id}
          onChange={setEscenarioId}
        />
        <Slicer label="Período" options={PERIODOS} value={periodo} onChange={setPeriodo} />
        <Slicer
          label="Plan"
          options={[{ key: "todos" as const, label: "Todos" }, ...PLANES]}
          value={plan}
          onChange={setPlan}
        />
        <label className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground font-medium">Tasa de corte</span>
          <input
            type="range"
            min={0.1}
            max={0.8}
            step={0.05}
            value={tasa}
            onChange={(event) => setTasa(Number(event.target.value))}
            className="accent-brand w-28"
            aria-label="Tasa de corte anual en dólares"
          />
          <span className="w-12 font-semibold tabular-nums">{Math.round(tasa * 100)} %</span>
        </label>
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">
        {escenario.supuestos} Valores en moneda constante de agosto de 2026; USD al tipo de cambio de ARS{" "}
        {usd0.format(modelo.tipoCambio)}.
      </p>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={`VAN al ${Math.round(tasa * 100)} % anual`}
          value={fmtUsd(kpi.van)}
          tone={kpi.van < 0 ? "danger" : "default"}
          hint={`Índice de rentabilidad ${pct1.format(kpi.indiceRentabilidad)} · inversión ${fmtUsd(kpi.inversionUsd)}`}
        />
        <StatTile
          label="TIR anual"
          value={kpi.tirAnual == null ? "—" : fmtPct(kpi.tirAnual * 100)}
          tone={kpi.tirAnual != null && kpi.tirAnual < tasa ? "warning" : "default"}
          hint={`Contra una tasa de corte del ${Math.round(tasa * 100)} % · ROI ${fmtPct(kpi.roi * 100)}`}
        />
        <StatTile
          label="Repago simple"
          value={<span className="text-lg">{formatoPlazo(kpi.repago)}</span>}
          tone={kpi.repago == null ? "danger" : "default"}
          hint={`Descontado: ${formatoPlazo(kpi.repagoDescontado)}`}
        />
        <StatTile
          label="Necesidad máxima de financiamiento"
          value={fmtUsd(kpi.necesidadMaxima)}
          hint={`Punto más bajo del flujo acumulado: ${meses[kpi.mesNecesidadMaxima]}`}
        />
        <StatTile
          label={`Cartera facturada · ${meses[cierre]}`}
          value={resumen.clientesCierre}
          hint={
            plan === "todos" && penCierre
              ? `Meta del plan: ${penCierre.meta} cuentas`
              : `Plan ${PLANES.find((p) => p.key === plan)?.label}`
          }
        />
        <StatTile
          label={`MRR · ${meses[cierre]}`}
          value={fmtUsd(resumen.mrrCierreUsd)}
          hint={`Facturación del período ${fmtArsM(resumen.ingresos)}`}
        />
        <StatTile
          label="Penetración del área abordada"
          value={penCierre ? fmtPct(penCierre.porcentaje) : "—"}
          tone={penCierre && penCierre.cuentas < penCierre.meta ? "warning" : "default"}
          hint={
            penCierre
              ? `${penCierre.cuentas} de ${penCierre.sedes} sedes · meta ${fmtPct(penCierre.porcentajeMeta)}`
              : undefined
          }
        />
        <StatTile
          label="Punto de equilibrio"
          value={`${modelo.equilibrio.monotributo} complejos`}
          hint={`${modelo.equilibrio.sas} en la etapa SAS · flujo mensual positivo desde ${
            kpi.primerMesPositivo != null ? meses[kpi.primerMesPositivo] : "—"
          }`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Cartera facturada contra las metas de penetración"
          why="Columnas apiladas por plan: muestran cuántas cuentas pagan cada mes y de qué plan, y los rombos marcan la meta del punto 6.2. La línea punteada es el punto de equilibrio. Clic en un mes: filtra su año."
        >
          <Legend
            items={[
              ...planes.map((p) => ({ label: p.label, color: PLAN_COLOR[p.key] })),
              ...(plan === "todos" ? [{ label: "Meta de cartera", color: "var(--foreground)", kind: "diamond" as const }] : []),
              { label: "Equilibrio", color: "var(--muted-foreground)", kind: "dash" as const },
            ]}
          />
          <TimeChart
            labels={meses}
            ariaLabel="Cuentas facturadas por mes y plan, con metas y punto de equilibrio"
            format={(v) => `${usd0.format(v)}`}
            columns={planes.map((p) => ({
              key: p.key,
              label: p.label,
              color: PLAN_COLOR[p.key],
              values: escenario.clientes[p.key],
            }))}
            steps={{
              label: "Equilibrio",
              color: "var(--muted-foreground)",
              values: meses.map((_, t) => (t === 0 ? 0 : equilibrioEn(modelo, escenario, t))),
            }}
            targets={
              plan === "todos"
                ? {
                    label: "Meta",
                    color: "var(--foreground)",
                    points: modelo.mercado.map((m) => ({ index: cierreDelPeriodo(m.anio as Periodo), value: m.metaCuentas })),
                  }
                : undefined
            }
            markers={sasDesde != null ? [{ index: sasDesde, label: "SAS", color: "var(--muted-foreground)" }] : []}
            highlight={inPeriod}
            onSelect={(t) => t > 0 && setPeriodo(anioDelMes(t) as Periodo)}
          />
        </ChartCard>

        <ChartCard
          title={`Mix de planes · ${meses[cierre]}`}
          why="Anillo: la parte de cada plan en una cartera que suma el total del centro. Clic en un plan: filtra el tablero."
        >
          <Donut
            ariaLabel="Cuentas por plan al cierre del período"
            slices={PLANES.map((p) => ({
              key: p.key,
              label: p.label,
              value: escenario.clientes[p.key][cierre] ?? 0,
              color: PLAN_COLOR[p.key],
            }))}
            format={(v) => usd0.format(v)}
            selected={plan === "todos" ? null : plan}
            onSelect={(key) => setPlan((current) => (current === key ? "todos" : (key as PlanKey)))}
            center={
              <>
                <span className="font-heading text-2xl font-semibold tabular-nums">
                  {clientesEn(escenario, cierre)}
                </span>
                <span className="text-muted-foreground text-xs">cuentas</span>
              </>
            }
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Flujo de fondos acumulado y recupero de la inversión"
          why="Líneas: el saldo acumulado, simple y descontado a la tasa de corte, es una serie continua; donde cruza el cero se recupera la inversión y su punto más bajo es la necesidad máxima de financiamiento."
        >
          <Legend
            items={[
              { label: "Acumulado simple", color: "var(--viz-1)", kind: "line" },
              { label: `Acumulado descontado (${Math.round(tasa * 100)} %)`, color: "var(--viz-2)", kind: "dash" },
            ]}
          />
          <TimeChart
            labels={meses}
            ariaLabel="Flujo de fondos acumulado simple y descontado en dólares"
            format={fmtUsd}
            axisFormat={axisUsd}
            lines={[
              { key: "simple", label: "Acumulado simple", color: "var(--viz-1)", values: acumulado(flows) },
              {
                key: "desc",
                label: "Acumulado descontado",
                color: "var(--viz-2)",
                dashed: true,
                values: acumulado(descontado(flows, tasa)),
              },
            ]}
            markers={
              kpi.repago != null
                ? [{ index: Math.ceil(kpi.repago), label: "Recupero", color: "var(--viz-1)" }]
                : []
            }
            highlight={inPeriod}
          />
        </ChartCard>

        <ChartCard
          title={`VAN por escenario al ${Math.round(tasa * 100)} %`}
          why="Barras horizontales: comparan un mismo valor entre escenarios y separan a la vista los que destruyen valor. Clic en una barra: cambia el escenario del tablero."
        >
          <HBars
            ariaLabel="Valor actual neto por escenario"
            items={modelo.escenarios.map((e) => ({
              key: e.id,
              label: e.nombre,
              value: van(flujoNetoUsd(e, modelo.tipoCambio), tasa),
            }))}
            format={fmtUsd}
            selected={escenario.id}
            onSelect={setEscenarioId}
          />
          <p className="text-muted-foreground text-xs">
            Mové la tasa de corte para ver con qué exigencia cada escenario deja de crear valor.
          </p>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title={`Cascada de fondos · ${PERIODOS.find((p) => p.key === periodo)?.label}`}
          why="Cascada: parte de lo cobrado y descuenta cada rubro hasta el flujo neto, así se ve qué salida pesa más en el período elegido."
        >
          <Legend
            items={[
              { label: "Entradas", color: "var(--viz-1)" },
              { label: "Salidas", color: "var(--viz-2)" },
              { label: "Flujo neto", color: "var(--foreground)" },
            ]}
          />
          <Waterfall
            ariaLabel="Cascada de cobranzas, egresos por rubro e inversión hasta el flujo neto"
            format={fmtArsM}
            axisFormat={axisArs}
            steps={[
              { key: "cob", label: "Cobranzas", value: resumen.cobranzas, kind: "start" },
              ...RUBROS.filter((r) => resumen.egresos[r.key] > 0).map((r) => ({
                key: r.key,
                label: r.label,
                short: r.corto,
                value: resumen.egresos[r.key],
                kind: "out" as const,
              })),
              ...(resumen.inversion > 0
                ? [{ key: "inv", label: "Inversión inicial", short: "Inversión", value: resumen.inversion, kind: "out" as const }]
                : []),
              ...(resumen.recupero > 0
                ? [{ key: "rec", label: "Recupero al cierre", short: "Recupero", value: resumen.recupero, kind: "in" as const }]
                : []),
              { key: "fnf", label: "Flujo neto", value: resumen.flujoNeto, kind: "total" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Penetración por anillo geográfico"
          why="Barras con marca de meta: cada año compara las cuentas contra las sedes del área ya abordada (puntos 4.3 y 6.2); la raya negra es la meta del plan."
        >
          <HBars
            ariaLabel="Penetración del área abordada por año contra la meta"
            items={pen.map((p) => ({
              key: String(p.anio),
              label: `${p.anio} · ${p.sedes} sedes`,
              value: p.porcentaje,
              target: p.porcentajeMeta,
              detail: `${p.cuentas} cuentas`,
            }))}
            format={fmtPct}
            selected={periodo === "todo" ? null : String(periodo)}
            onSelect={(key) => setPeriodo(Number(key) as Periodo)}
          />
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-border/60 border-b">
                <th className="py-1.5 text-left font-medium">Año</th>
                <th className="py-1.5 text-right font-medium">Sedes</th>
                <th className="py-1.5 text-right font-medium">Meta</th>
                <th className="py-1.5 text-right font-medium">Cuentas</th>
                <th className="py-1.5 text-right font-medium">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {pen.map((p) => (
                <tr key={p.anio} className="border-border/40 border-b tabular-nums">
                  <td className="py-1.5">{p.anio}</td>
                  <td className="py-1.5 text-right">{p.sedes}</td>
                  <td className="py-1.5 text-right">{p.meta}</td>
                  <td className="py-1.5 text-right">{p.cuentas}</td>
                  <td className={cn("py-1.5 text-right font-semibold", p.cuentas < p.meta && "text-destructive")}>
                    {Math.round((p.cuentas / p.meta) * 100)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Ingreso recurrente mensual (MRR) por plan"
          why="Columnas apiladas en dólares: el MRR es el abono que la cartera paga cada mes, y el apilado deja ver qué plan sostiene el crecimiento. Clic en un mes: filtra su año."
        >
          <Legend items={planes.map((p) => ({ label: p.label, color: PLAN_COLOR[p.key] }))} />
          <TimeChart
            labels={meses}
            ariaLabel="Ingreso recurrente mensual en dólares por plan"
            height={300}
            format={fmtUsd}
            axisFormat={axisUsd}
            columns={planes.map((p) => ({
              key: p.key,
              label: p.label,
              color: PLAN_COLOR[p.key],
              values: meses.map((_, t) => ingresosEn(escenario, t, p.key) / modelo.tipoCambio),
            }))}
            highlight={inPeriod}
            onSelect={(t) => t > 0 && setPeriodo(anioDelMes(t) as Periodo)}
          />
        </ChartCard>

        <ChartCard
          title={`Altas por localidad hasta ${meses[cierre]}`}
          why="Barras apiladas por plan, ordenadas de mayor a menor: muestran dónde se concentra la captación según la secuencia geográfica (escenario base, hoja Clientes)."
        >
          <Legend items={PLANES.map((p) => ({ label: p.label, color: PLAN_COLOR[p.key] }))} />
          <HBars
            ariaLabel="Altas acumuladas por localidad y plan"
            items={altasPorLocalidad(modelo, cierre).map((l) => ({
              key: l.localidad,
              label: l.localidad,
              value: l.total,
              segments: PLANES.map((p) => ({
                key: p.key,
                label: p.label,
                value: l.porPlan[p.key],
                color: PLAN_COLOR[p.key],
              })),
            }))}
            format={(v) => usd0.format(v)}
          />
        </ChartCard>
      </div>

      <AnnualMatrix modelo={modelo} escenario={escenario} periodo={periodo} />

      <p className="text-muted-foreground text-xs">
        Fuente: {modelo.fuente} ({modelo.actualizado}).{" "}
        {coincideExcel && (
          <span>
            Los indicadores se recalculan en el tablero y coinciden con la hoja Flujos Fondos del Excel (VAN{" "}
            {fmtUsd(vanExcel!)}).
          </span>
        )}
      </p>
    </div>
  );
}

function Slicer<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" role="radiogroup" aria-label={label}>
      <span className="text-muted-foreground font-medium">{label}</span>
      <div className="bg-foreground/5 flex flex-wrap gap-0.5 rounded-lg p-0.5">
        {options.map((option) => (
          <button
            key={String(option.key)}
            type="button"
            role="radio"
            aria-checked={value === option.key}
            onClick={() => onChange(option.key)}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              value === option.key
                ? "bg-card text-foreground ring-foreground/10 shadow-sm ring-1"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  why,
  className,
  children,
}: {
  title: string;
  why: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{why}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
