"use client";

import { useState } from "react";
import { CalendarClock, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { courtsService } from "@/services/courts.service";
import type { BulkPriceAdjustResult } from "@/types/api/turnos";
import { todayKey } from "@/features/agenda/lib/schedule";

/**
 * "Subí todo 10%": adjusts every court price + price rule in one shot, with a
 * dry-run preview before applying. Prices move monthly in Argentina — this kills
 * the court-by-court monthly friction.
 */
export function BulkPriceDialog() {
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState("10");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [preview, setPreview] = useState<BulkPriceAdjustResult | null>(null);
  const queryClient = useQueryClient();

  const scheduledQuery = useQuery({
    queryKey: queryKeys.courts.scheduledAdjustments,
    queryFn: courtsService.listScheduledAdjustments,
    enabled: open,
  });
  const removeScheduled = useMutation({
    mutationFn: (id: string) => courtsService.removeScheduledAdjustment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courts.scheduledAdjustments });
      toast.success("Aumento programado eliminado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const isScheduling = !!effectiveDate && effectiveDate > todayKey();

  const percentNumber = Number(percent);
  const percentValid =
    Number.isFinite(percentNumber) && percentNumber !== 0 && percentNumber >= -50 && percentNumber <= 300;

  const adjust = useMutation({
    mutationFn: (dryRun: boolean) =>
      courtsService.bulkPrice({
        percent: percentNumber,
        dryRun,
        ...(isScheduling && !dryRun ? { effectiveDate } : {}),
      }),
    onSuccess: (result) => {
      if (result.scheduled) {
        toast.success(`Aumento programado para el ${result.effectiveDateKey}`);
        void queryClient.invalidateQueries({ queryKey: queryKeys.courts.scheduledAdjustments });
        setOpen(false);
        return;
      }
      if (!result.applied) {
        setPreview(result);
        return;
      }
      toast.success(`Precios actualizados (${result.percent > 0 ? "+" : ""}${result.percent}%)`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.courts.all });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function reset() {
    setPercent("10");
    setEffectiveDate("");
    setPreview(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <TrendingUp className="size-4" />
        Ajustar precios
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste masivo de precios</DialogTitle>
          <DialogDescription>
            Cambia el precio de todas las canchas y sus precios por franja de una vez,
            redondeando a los $100.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bulk-percent">Porcentaje</Label>
            <Input
              id="bulk-percent"
              type="number"
              inputMode="numeric"
              min={-50}
              max={300}
              step={1}
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value);
                setPreview(null);
              }}
              className="w-28"
              disabled={adjust.isPending}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => adjust.mutate(true)}
            disabled={!percentValid || adjust.isPending}
          >
            Ver cómo queda
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bulk-effective">Aplicar desde (opcional)</Label>
          <Input
            id="bulk-effective"
            type="date"
            min={todayKey()}
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-44"
            disabled={adjust.isPending}
          />
          <p className="text-muted-foreground text-xs">
            {isScheduling
              ? `Los precios cambian solos el ${effectiveDate} a la madrugada.`
              : "Vacío = se aplica ahora mismo."}
          </p>
        </div>

        {(scheduledQuery.data ?? []).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <CalendarClock className="size-3.5" /> Aumentos programados
            </p>
            {(scheduledQuery.data ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
              >
                <span>
                  {item.percent > 0 ? "+" : ""}
                  {item.percent}% desde el {item.effectiveDateKey}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar aumento programado"
                  onClick={() => removeScheduled.mutate(item.id)}
                  disabled={removeScheduled.isPending}
                  className="text-muted-foreground hover:text-destructive size-7"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {preview && (
          <div className="flex flex-col gap-2">
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {preview.courts.map((court) => (
                    <tr key={court.id} className="border-b last:border-0">
                      <td className="px-3 py-1.5 font-medium">{court.name}</td>
                      <td className="text-muted-foreground px-3 py-1.5 text-right tabular-nums line-through">
                        {formatPrice(court.beforeCents)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                        {formatPrice(court.afterCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.priceRulesUpdated > 0 && (
              <p className="text-muted-foreground text-xs">
                También se ajustan {preview.priceRulesUpdated} precio(s) por franja.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={() => adjust.mutate(false)}
            disabled={!percentValid || (!preview && !isScheduling) || adjust.isPending}
          >
            {adjust.isPending
              ? "Guardando…"
              : isScheduling
                ? `Programar para el ${effectiveDate}`
                : "Aplicar a todo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
