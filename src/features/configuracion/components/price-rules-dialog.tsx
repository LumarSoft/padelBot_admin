"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { allBandsForCourt } from "@/features/agenda/lib/schedule";
import {
  useCreatePriceRule,
  useDeletePriceRule,
  usePriceRules,
} from "@/features/configuracion/hooks/use-price-rules";
import type { Court } from "@/types/api/turnos";

export function PriceRulesDialog({
  court,
  open,
  onOpenChange,
}: {
  court: Court;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rulesQuery = usePriceRules(court.id, open);
  const createRule = useCreatePriceRule(court.id);
  const deleteRule = useDeletePriceRule(court.id);

  const bands = useMemo(() => allBandsForCourt(court), [court]);

  const rules = rulesQuery.data ?? [];
  // Bands that don't have an exception yet — the only ones offered to add.
  const usedStarts = new Set(rules.map((r) => r.startTime));
  const freeBands = bands.filter((b) => !usedStarts.has(b.start));

  const [bandStart, setBandStart] = useState("");
  const [price, setPrice] = useState("");

  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;

  function handleAdd(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!bandStart || !priceValid) return;
    createRule.mutate(
      { startTime: bandStart, priceCents: Math.round(priceNumber * 100) },
      {
        onSuccess: () => {
          setBandStart("");
          setPrice("");
        },
      },
    );
  }

  function bandLabel(start: string): string {
    const band = bands.find((b) => b.start === start);
    return band ? `${band.start}–${band.end}` : start;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Precios por horario — {court.name}</DialogTitle>
          <DialogDescription>
            Por defecto todas las franjas cuestan {formatPrice(court.priceCents)}. Agregá
            excepciones para los horarios que tengan otro precio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {rulesQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando excepciones…
            </div>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
              Sin excepciones: todas las franjas usan el precio por defecto.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span className="tabular-nums">{bandLabel(rule.startTime)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      {formatPrice(rule.priceCents)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar excepción ${rule.startTime}`}
                      onClick={() => deleteRule.mutate(rule.id)}
                      disabled={deleteRule.isPending}
                      className="text-muted-foreground hover:text-destructive size-8"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {freeBands.length > 0 && (
            <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Agregar excepción</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="rule-band">Franja</Label>
                  <select
                    id="rule-band"
                    value={bandStart}
                    onChange={(e) => setBandStart(e.target.value)}
                    disabled={createRule.isPending}
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="">Elegí una franja</option>
                    {freeBands.map((b) => (
                      <option key={b.start} value={b.start}>
                        {b.start}–{b.end}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="rule-price">Precio (ARS)</Label>
                  <Input
                    id="rule-price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={String(court.priceCents / 100)}
                    disabled={createRule.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createRule.isPending || !bandStart || !priceValid}
                >
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
