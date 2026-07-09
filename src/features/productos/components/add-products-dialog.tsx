"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { computeBookingAccount } from "@/lib/booking-account";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useSetBookingProducts } from "@/features/reservas/hooks/use-bookings";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/api/products";
import type { BookingProductEntry } from "@/types/api/bookings";
import type { Product } from "@/types/api/products";

const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

const ALL_PLAYERS = [1, 2, 3, 4];

let draftLineSeq = 0;
function nextDraftKey(): string {
  draftLineSeq += 1;
  return `draft-${draftLineSeq}`;
}

interface DraftLine {
  key: string;
  productId: string;
  quantity: number;
  players: number[];
}

function linesFromEntries(entries: BookingProductEntry[]): DraftLine[] {
  return entries.map((entry) => ({
    key: entry.id,
    productId: entry.product.id,
    quantity: entry.quantity,
    players:
      entry.players.length > 0 ? [...entry.players].sort() : ALL_PLAYERS,
  }));
}

function QuantityControl({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums font-medium">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}

/** Multi-select chips for the 4 fixed players, plus a "Todos" shortcut. At least one stays selected. */
function PlayerChips({
  players,
  onChange,
  disabled,
}: {
  players: number[];
  onChange: (players: number[]) => void;
  disabled?: boolean;
}) {
  const allSelected = players.length === 4;

  function toggle(player: number) {
    if (players.includes(player)) {
      if (players.length === 1) return;
      onChange(players.filter((p) => p !== player).sort());
    } else {
      onChange([...players, player].sort());
    }
  }

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
      active
        ? "border-brand bg-brand/10 text-brand"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(ALL_PLAYERS)}
        className={chipClass(allSelected)}
      >
        Todos
      </button>
      {ALL_PLAYERS.map((player) => (
        <button
          key={player}
          type="button"
          disabled={disabled}
          onClick={() => toggle(player)}
          className={chipClass(players.includes(player))}
        >
          J{player}
        </button>
      ))}
    </div>
  );
}

export function AddProductsDialog({
  bookingId,
  playerName,
  courtPriceCents,
  currentProducts,
  open,
  onOpenChange,
}: {
  bookingId: string;
  playerName: string;
  courtPriceCents: number;
  currentProducts: BookingProductEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: catalog, isLoading } = useProducts();
  const setProducts = useSetBookingProducts();

  const [lines, setLines] = useState<DraftLine[]>(() =>
    linesFromEntries(currentProducts),
  );
  const [picker, setPicker] = useState("");

  const activeProducts = (catalog ?? []).filter((p) => p.isActive);
  // Snapshot prices from the current lines cover products that got deactivated since — the
  // catalog price still wins for anything still active.
  const snapshotPriceById = new Map(
    currentProducts.map((entry) => [entry.product.id, entry.unitPriceCents]),
  );
  const priceForProduct = (productId: string): number =>
    activeProducts.find((p) => p.id === productId)?.priceCents ??
    snapshotPriceById.get(productId) ??
    0;

  const byCategory = activeProducts.reduce<Record<string, Product[]>>(
    (acc, p) => {
      acc[p.category] = [...(acc[p.category] ?? []), p];
      return acc;
    },
    {},
  );

  const account = computeBookingAccount(
    courtPriceCents,
    lines.map((line) => ({
      unitPriceCents: priceForProduct(line.productId),
      quantity: line.quantity,
      players: line.players,
    })),
  );

  function addLine(productId: string) {
    setLines((prev) => [
      ...prev,
      { key: nextDraftKey(), productId, quantity: 1, players: ALL_PLAYERS },
    ]);
    setPicker("");
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  function handleSave() {
    const items = lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      players: line.players,
    }));
    setProducts.mutate(
      { bookingId, body: { items } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5" />
            Cuenta del turno — {playerName}
          </DialogTitle>
          <DialogDescription>
            Repartí la cancha y los consumos entre los 4 jugadores. Se guarda
            en la reserva para tu control interno.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
          <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Cancha {formatPrice(courtPriceCents)} ÷ 4
            </span>
            <span className="font-medium tabular-nums">
              {formatPrice(account.courtSharesCents[0])} c/u
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Select
              value={picker}
              onValueChange={(value) => value && addLine(value)}
            >
              <SelectTrigger className="w-full" disabled={isLoading}>
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Cargando catálogo…"
                      : activeProducts.length === 0
                        ? "No hay productos activos en el catálogo"
                        : "Agregar consumo del catálogo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map(
                  (cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel>{CATEGORY_LABELS[cat]}</SelectLabel>
                      {byCategory[cat].map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} · {formatPrice(product.priceCents)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ),
                )}
              </SelectContent>
            </Select>

            {lines.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-sm">
                Sin consumos todavía.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((line) => {
                  const product =
                    activeProducts.find((p) => p.id === line.productId) ??
                    currentProducts.find((e) => e.product.id === line.productId)
                      ?.product;
                  return (
                    <div
                      key={line.key}
                      className="flex flex-col gap-2 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {product?.name ?? "Producto"}
                        </p>
                        <div className="flex items-center gap-2">
                          <QuantityControl
                            value={line.quantity}
                            onChange={(v) => updateLine(line.key, { quantity: v })}
                            disabled={setProducts.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-7"
                            disabled={setProducts.isPending}
                            onClick={() => removeLine(line.key)}
                            title="Quitar línea"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <PlayerChips
                        players={line.players}
                        onChange={(players) => updateLine(line.key, { players })}
                        disabled={setProducts.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="grid grid-cols-4 gap-2">
            {ALL_PLAYERS.map((player) => (
              <div
                key={player}
                className="bg-muted/40 rounded-lg border px-2 py-1.5 text-center"
              >
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  J{player}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatPrice(account.perPlayerCents[player - 1])}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total turno</span>
            <span className="font-semibold tabular-nums">
              {formatPrice(account.totalCents)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setProducts.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={setProducts.isPending}>
            {setProducts.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cuenta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
