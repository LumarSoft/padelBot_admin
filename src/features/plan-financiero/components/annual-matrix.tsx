"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Escenario, ModeloFinanciero, Periodo } from "@/features/plan-financiero/lib/types";
import { RUBROS } from "@/features/plan-financiero/lib/types";
import {
  acumulado,
  clientesEn,
  flujoNetoArs,
  ingresosEn,
} from "@/features/plan-financiero/lib/metrics";

const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

interface Column {
  key: string;
  label: string;
  months: number[];
  close: number;
  period: Periodo | "mes0";
}

const COLUMNS: Column[] = [
  { key: "m0", label: "Mes 0 (dic. 2026)", months: [0], close: 0, period: "mes0" },
  { key: "2027", label: "2027", months: range(1, 12), close: 12, period: 2027 },
  { key: "2028", label: "2028", months: range(13, 24), close: 24, period: 2028 },
  { key: "2029", label: "2029", months: range(25, 36), close: 36, period: 2029 },
  { key: "total", label: "36 meses", months: range(0, 36), close: 36, period: "todo" },
];

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/**
 * The matrix under the visuals — the same figures as a table, so no number depends on
 * hovering a chart, and a CSV export of exactly what is on screen.
 */
export function AnnualMatrix({
  modelo,
  escenario,
  periodo,
}: {
  modelo: ModeloFinanciero;
  escenario: Escenario;
  periodo: Periodo;
}) {
  const fnf = flujoNetoArs(escenario);
  const cum = acumulado(fnf.map((v) => v / modelo.tipoCambio));
  const sum = (series: number[], months: number[]) => months.reduce((a, t) => a + (series[t] ?? 0), 0);

  const rows: { label: string; strong?: boolean; values: (c: Column) => number; unit: string }[] = [
    { label: "Cuentas facturadas al cierre", unit: "cuentas", values: (c) => clientesEn(escenario, c.close) },
    {
      label: "MRR al cierre (USD)",
      unit: "USD",
      values: (c) => ingresosEn(escenario, c.close) / modelo.tipoCambio,
    },
    {
      label: "Ingresos devengados",
      unit: "ARS",
      values: (c) => c.months.reduce((a, t) => a + ingresosEn(escenario, t), 0),
    },
    { label: "(+) Cobranzas", unit: "ARS", strong: true, values: (c) => sum(escenario.cobranzas, c.months) },
    ...RUBROS.map((r) => ({
      label: `(−) ${r.label}`,
      unit: "ARS",
      values: (c: Column) => sum(escenario.egresos[r.key], c.months),
    })),
    { label: "(−) Inversión inicial", unit: "ARS", values: (c) => sum(escenario.inversion, c.months) },
    { label: "(+) Recupero al cierre", unit: "ARS", values: (c) => sum(escenario.recupero, c.months) },
    { label: "Flujo neto de fondos", unit: "ARS", strong: true, values: (c) => sum(fnf, c.months) },
    {
      label: "Flujo neto de fondos (USD)",
      unit: "USD",
      strong: true,
      values: (c) => sum(fnf, c.months) / modelo.tipoCambio,
    },
    { label: "Flujo acumulado al cierre (USD)", unit: "USD", values: (c) => cum[c.close] },
  ];

  const active = (c: Column) =>
    (periodo === "todo" && c.period === "todo") || c.period === periodo;

  function exportCsv() {
    const lines = [
      ["Concepto", "Unidad", ...COLUMNS.map((c) => c.label)],
      ...rows.map((r) => [r.label, r.unit, ...COLUMNS.map((c) => Math.round(r.values(c)).toString())]),
    ];
    const csv = lines.map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `plan-financiero_${escenario.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Presupuesto financiero · {escenario.nombre}</p>
            <p className="text-muted-foreground text-xs">
              Matriz por año (puntos 8.1 a 8.8): la misma información de las visualizaciones, en tabla y en
              moneda constante.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="text-muted-foreground border-border/60 border-b">
                <th className="py-2 pr-3 text-left font-medium">Concepto</th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-2 py-2 text-right font-medium",
                      active(c) && "text-foreground bg-foreground/5",
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className={cn("border-border/40 border-b", r.strong && "font-semibold")}>
                  <td className="py-1.5 pr-3">
                    {r.label}
                    <span className="text-muted-foreground ml-1 font-normal">{r.unit !== "cuentas" && `(${r.unit})`}</span>
                  </td>
                  {COLUMNS.map((c) => {
                    const v = r.values(c);
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          "px-2 py-1.5 text-right tabular-nums",
                          active(c) && "bg-foreground/5",
                          v < 0 && "text-destructive",
                        )}
                      >
                        {Math.abs(v) < 0.5 ? "–" : `${v < 0 ? "−" : ""}${num.format(Math.abs(v))}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
