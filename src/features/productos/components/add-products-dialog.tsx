"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  Landmark,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
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
import { computeBookingAccount, splitEqually } from "@/lib/booking-account";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useSetBookingProducts } from "@/features/reservas/hooks/use-bookings";
import { bookingsService } from "@/services/bookings.service";
import { queryKeys } from "@/lib/query-keys";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/api/products";
import type {
  BookingAccountView,
  BookingProductEntry,
  PlayerPaymentMethod,
} from "@/types/api/bookings";
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

/**
 * Who pays this line: J1–J4 as unmistakable on/off toggles (lleno = lo paga,
 * punteado = no) plus the resulting share per selected player, so the effect of
 * every tap is visible on the spot.
 */
function PlayerToggles({
  players,
  lineTotalCents,
  onChange,
  disabled,
}: {
  players: number[];
  lineTotalCents: number;
  onChange: (players: number[]) => void;
  disabled?: boolean;
}) {
  const allSelected = players.length === 4;
  const shareCents =
    players.length > 0 ? splitEqually(lineTotalCents, players.length)[0] : 0;

  function toggle(player: number) {
    if (players.includes(player)) {
      if (players.length === 1) return; // someone has to pay it
      onChange(players.filter((p) => p !== player).sort());
    } else {
      onChange([...players, player].sort());
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">Lo pagan:</span>
      <div className="flex items-center gap-1">
        {ALL_PLAYERS.map((player) => {
          const active = players.includes(player);
          return (
            <button
              key={player}
              type="button"
              disabled={disabled}
              onClick={() => toggle(player)}
              aria-pressed={active}
              title={
                active
                  ? `J${player} lo paga — tocá para sacarlo`
                  : `Sumar a J${player}`
              }
              className={cn(
                "flex size-7 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                active
                  ? "border-brand bg-brand text-brand-foreground shadow-sm"
                  : "border-dashed text-muted-foreground/60 hover:border-solid hover:text-foreground",
              )}
            >
              J{player}
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled || allSelected}
          onClick={() => onChange(ALL_PLAYERS)}
          className={cn(
            "ml-1 text-xs underline-offset-2",
            allSelected
              ? "text-muted-foreground/50"
              : "text-muted-foreground hover:text-foreground underline",
          )}
        >
          todos
        </button>
      </div>
      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
        {players.length === 1
          ? `paga J${players[0]}`
          : `${formatPrice(shareCents)} c/u entre ${players.length}`}
      </span>
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
  const queryClient = useQueryClient();

  const [lines, setLines] = useState<DraftLine[]>(() =>
    linesFromEntries(currentProducts),
  );
  const [picker, setPicker] = useState("");

  // Server truth for payments/seña/settled — the draft lines only affect "debe".
  const accountQuery = useQuery({
    queryKey: queryKeys.bookings.account(bookingId),
    queryFn: () => bookingsService.getAccount(bookingId),
    enabled: open,
  });
  const serverAccount = accountQuery.data ?? null;

  const [payingSlot, setPayingSlot] = useState<number | null>(null);
  const registerPayment = useMutation({
    mutationFn: async (input: {
      playerSlot: number;
      amountCents: number;
      method: PlayerPaymentMethod;
    }) => {
      // The bill must reflect what's on screen: persist draft consumos before charging.
      await saveLines();
      return bookingsService.addPlayerPayment(bookingId, input);
    },
    onSuccess: (fresh) => {
      queryClient.setQueryData(queryKeys.bookings.account(bookingId), fresh);
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      if (fresh.settledAt) toast.success("✓ Turno finalizado — cuenta completa");
      else toast.success("Pago registrado");
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setPayingSlot(null),
  });
  const undoPayment = useMutation({
    mutationFn: (paymentId: string) =>
      bookingsService.removePlayerPayment(bookingId, paymentId),
    onSuccess: (fresh) => {
      queryClient.setQueryData(queryKeys.bookings.account(bookingId), fresh);
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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

  async function saveLines() {
    const items = lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      players: line.players,
    }));
    await setProducts.mutateAsync({ bookingId, body: { items } });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bookings.account(bookingId),
    });
  }

  function handleSave() {
    void saveLines().then(() => onOpenChange(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5" />
            Cuenta del turno — {playerName}
          </DialogTitle>
          <DialogDescription>
            Cargá los consumos y marcá quién paga cada cosa; a la derecha registrás los
            pagos. Cuando la cuenta queda en cero, el turno se marca finalizado solo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Columna izquierda: la cuenta (cancha + consumos) ── */}
          <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1">
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Cancha {formatPrice(courtPriceCents)} ÷ 4
              </span>
              <span className="font-medium tabular-nums">
                {formatPrice(account.courtSharesCents[0])} c/u
              </span>
            </div>

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
                        : "＋ Agregar consumo del catálogo"
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
              <p className="text-muted-foreground py-3 text-center text-sm">
                Sin consumos todavía — solo se reparte la cancha.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((line) => {
                  const product =
                    activeProducts.find((p) => p.id === line.productId) ??
                    currentProducts.find((e) => e.product.id === line.productId)
                      ?.product;
                  const unitCents = priceForProduct(line.productId);
                  const lineTotalCents = unitCents * line.quantity;
                  return (
                    <div
                      key={line.key}
                      className="flex flex-col gap-2 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product?.name ?? "Producto"}
                          </p>
                          {line.quantity > 1 && (
                            <p className="text-muted-foreground text-xs tabular-nums">
                              {formatPrice(unitCents)} × {line.quantity}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <QuantityControl
                            value={line.quantity}
                            onChange={(v) =>
                              updateLine(line.key, { quantity: v })
                            }
                            disabled={setProducts.isPending}
                          />
                          <span className="w-20 text-right text-sm font-semibold tabular-nums">
                            {formatPrice(lineTotalCents)}
                          </span>
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
                      <PlayerToggles
                        players={line.players}
                        lineTotalCents={lineTotalCents}
                        onChange={(players) => updateLine(line.key, { players })}
                        disabled={setProducts.isPending}
                      />
                    </div>
                  );
                })}
                <div className="text-muted-foreground flex items-center justify-between px-1 text-xs">
                  <span>Consumos</span>
                  <span className="tabular-nums">
                    {formatPrice(account.consumosTotalCents)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Columna derecha: quién paga ── */}
          <SettlementSection
            draftOwes={account.perPlayerCents}
            draftTotalCents={account.totalCents}
            playerName={playerName}
            serverAccount={serverAccount}
            loading={accountQuery.isLoading}
            payingSlot={payingSlot}
            busy={
              registerPayment.isPending ||
              undoPayment.isPending ||
              setProducts.isPending
            }
            onPay={(playerSlot, amountCents, method) => {
              setPayingSlot(playerSlot);
              registerPayment.mutate({ playerSlot, amountCents, method });
            }}
            onUndo={(paymentId) => undoPayment.mutate(paymentId)}
          />
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
              "Guardar y cerrar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const METHODS: {
  value: PlayerPaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: "CASH", label: "Efectivo", icon: Banknote },
  { value: "QR", label: "QR", icon: QrCode },
  { value: "TRANSFER", label: "Transf.", icon: Landmark },
];

const METHOD_LABELS: Record<PlayerPaymentMethod, string> = {
  CASH: "efectivo",
  QR: "QR",
  TRANSFER: "transferencia",
};

/**
 * The settlement half of the bill: what each player owes (from the on-screen draft),
 * what they already put in (server truth — payments + la seña de J1), one-tap charge
 * buttons for the remainder, undo, and the "turno finalizado" state.
 */
function SettlementSection({
  draftOwes,
  draftTotalCents,
  playerName,
  serverAccount,
  loading,
  payingSlot,
  busy,
  onPay,
  onUndo,
}: {
  draftOwes: [number, number, number, number];
  draftTotalCents: number;
  playerName: string;
  serverAccount: BookingAccountView | null;
  loading: boolean;
  payingSlot: number | null;
  busy: boolean;
  onPay: (
    playerSlot: number,
    amountCents: number,
    method: PlayerPaymentMethod,
  ) => void;
  onUndo: (paymentId: string) => void;
}) {
  if (loading || !serverAccount) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando la cuenta…
      </div>
    );
  }

  const paidBySlot = serverAccount.players.map((p) => p.paidCents);
  const totalPaid =
    paidBySlot.reduce((a, b) => a + b, 0) + serverAccount.unassignedPaidCents;
  const totalRemaining = Math.max(0, draftTotalCents - totalPaid);
  const settled = totalRemaining === 0 && totalPaid > 0;

  return (
    <div className="flex flex-col gap-2">
      {ALL_PLAYERS.map((slot) => {
        const owes = draftOwes[slot - 1];
        const paid = paidBySlot[slot - 1];
        const remaining = Math.max(0, owes - paid);
        const isJ1 = slot === 1;
        const paidBesidesDeposit =
          paid - (isJ1 ? serverAccount.depositPaidCents : 0);
        return (
          <div
            key={slot}
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border px-3 py-2",
              remaining === 0 && "border-emerald-500/40 bg-emerald-500/[0.04]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium">
                J{slot}
                {isJ1 && ` · ${playerName}`}
              </p>
              {remaining === 0 ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Al día
                </span>
              ) : (
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  restan {formatPrice(remaining)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs tabular-nums">
                debe {formatPrice(owes)}
                {isJ1 && serverAccount.depositPaidCents > 0 && (
                  <span>
                    {" "}
                    · seña {formatPrice(serverAccount.depositPaidCents)} ✓
                  </span>
                )}
                {paidBesidesDeposit > 0 &&
                  ` · pagó ${formatPrice(paidBesidesDeposit)}`}
              </p>
              {remaining > 0 && (
                <div className="flex items-center gap-1">
                  {METHODS.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={busy}
                      title={`Registrar ${formatPrice(remaining)} en ${label.toLowerCase()}`}
                      onClick={() => onPay(slot, remaining, value)}
                    >
                      {payingSlot === slot && busy ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Icon className="size-3" />
                      )}
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {serverAccount.payments.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {serverAccount.payments.map((payment) => (
            <div
              key={payment.id}
              className="text-muted-foreground flex items-center justify-between gap-2 px-1 text-xs"
            >
              <span className="tabular-nums">
                J{payment.playerSlot} pagó {formatPrice(payment.amountCents)} en{" "}
                {METHOD_LABELS[payment.method]}
              </span>
              <button
                type="button"
                onClick={() => onUndo(payment.id)}
                disabled={busy}
                title="Deshacer este pago"
                className="hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {serverAccount.unassignedPaidCents > 0 && (
        <p className="text-muted-foreground px-1 text-xs">
          Además hay {formatPrice(serverAccount.unassignedPaidCents)} cobrados en
          mostrador sin asignar a un jugador.
        </p>
      )}

      <div className="mt-auto pt-1">
        {settled ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Turno finalizado — cuenta completa ({formatPrice(draftTotalCents)})
          </div>
        ) : (
          <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">
              Total {formatPrice(draftTotalCents)} · pagado {formatPrice(totalPaid)}
            </span>
            <span className="font-semibold tabular-nums">
              Restan {formatPrice(totalRemaining)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
