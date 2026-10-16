"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { monthName } from "@/features/plan/lib/format";
import { useWeeklySummary } from "@/features/ops/hooks/use-ops";
import type { MonthBusiness } from "@/types/api/ops";

const pesos = (cents: number) => formatPrice(Math.round(cents / 100) * 100);
const dash = (value: number | null) => (value === null ? "—" : value);

/** "octubre 2026". */
function monthLabel(month: string): string {
  return `${monthName(month)} ${month.slice(0, 4)}`;
}

/**
 * The business month by month: recurring revenue at each month's close, clubs paying, clubs
 * that started paying, churn (who stopped) and new clubs. Months before subscriptions were
 * recorded show only the new clubs; the rest is unknown, not zero.
 */
export function MonthlyBusiness({ months }: { months: MonthBusiness[] }) {
  // Nothing before the first month that has any data: no wall of empty rows.
  const firstUseful = months.findIndex((month) => month.tracked || month.newClubs > 0);
  const shown = firstUseful === -1 ? [] : months.slice(firstUseful).reverse();
  if (shown.length === 0) return null;
  const firstTracked = months.find((month) => month.tracked);

  return (
    <Card size="sm">
      <CardContent className="space-y-3 px-0">
        <div className="px-4">
          <p className="text-sm font-medium">Mes a mes</p>
          <p className="text-muted-foreground text-xs">
            Ingreso recurrente al cierre de cada mes, altas y bajas. Sin el club demo.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mes</TableHead>
              <TableHead className="text-right">Ingreso recurrente</TableHead>
              <TableHead className="text-right">Pagando</TableHead>
              <TableHead className="text-right">Empezaron a pagar</TableHead>
              <TableHead className="text-right">Bajas</TableHead>
              <TableHead className="pr-4 text-right">Clubes nuevos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((month) => (
              <TableRow key={month.month}>
                <TableCell className="pl-4 capitalize">{monthLabel(month.month)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {month.mrrCents === null ? "—" : pesos(month.mrrCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{dash(month.paying)}</TableCell>
                <TableCell className="text-right tabular-nums">{dash(month.newPaying)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    (month.churned ?? 0) > 0 && "text-red-600 dark:text-red-400",
                  )}
                  title={month.churnedClubs.join(", ") || undefined}
                >
                  {dash(month.churned)}
                  {month.churnedClubs.length > 0 && (
                    <span className="text-muted-foreground block text-xs">{month.churnedClubs.join(", ")}</span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{month.newClubs}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {firstTracked && (
          <p className="text-muted-foreground px-4 text-xs text-pretty">
            Las suscripciones se registran desde {monthLabel(firstTracked.month)}: antes de eso solo se
            sabe cuántos clubes se dieron de alta. Las altas y bajas de un mes se comparan con el
            anterior.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** What the Monday message to the ops channel will say, to read it before it goes out. */
export function WeeklySummaryPreview() {
  const [open, setOpen] = useState(false);
  const summary = useWeeklySummary(open);

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Resumen de los lunes</p>
            <p className="text-muted-foreground text-xs">
              Todos los lunes a las 9 llega al canal de ops con la semana anterior.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
            {open ? "Ocultar" : "Ver cómo sale hoy"}
          </Button>
        </div>
        {open && (
          <pre className="bg-muted/50 rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {summary.isLoading ? "Armando el resumen…" : (summary.data?.text ?? "No pudimos armarlo.")}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
