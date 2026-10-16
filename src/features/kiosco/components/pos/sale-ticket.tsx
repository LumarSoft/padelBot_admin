"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Landmark,
  Loader2,
  QrCode,
  ScanBarcode,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import {
  useCreateCounterSale,
  useUndoCounterSales,
} from "@/features/kiosco/hooks/use-stock";
import { stockWarning } from "@/features/kiosco/lib/stock-warning";
import { playPosCue } from "@/features/kiosco/lib/pos-sound";
import { POS_KEYS, useFunctionKeys } from "@/features/kiosco/hooks/use-function-keys";
import { QuantityStepper } from "@/features/kiosco/components/pos/quantity-stepper";
import { KeyHint } from "@/features/kiosco/components/pos/key-hint";
import { MAX_LINE_QUANTITY, usePosStore, type PosLine } from "@/stores/pos-store";
import type { Product } from "@/types/api/products";
import type { PlayerPaymentMethod } from "@/types/api/bookings";

const METHODS: {
  value: PlayerPaymentMethod;
  label: string;
  icon: typeof Banknote;
  shortcut: string;
}[] = [
  { value: "CASH", label: "Efectivo", icon: Banknote, shortcut: POS_KEYS.cash },
  { value: "QR", label: "QR", icon: QrCode, shortcut: POS_KEYS.qr },
  { value: "TRANSFER", label: "Transferencia", icon: Landmark, shortcut: POS_KEYS.transfer },
];

const METHOD_WORDS: Record<PlayerPaymentMethod, string> = {
  CASH: "en efectivo",
  QR: "con QR",
  TRANSFER: "por transferencia",
};

interface ChargedSale {
  ids: string[];
  totalCents: number;
  method: PlayerPaymentMethod;
  changeCents: number | null;
  /** When it was charged: a later scan starts a new ticket and hides this. */
  at: number;
}

/** Whole pesos typed by the cashier ("10000", "10.000") → cents; null when empty or invalid. */
function parsePesos(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? null : Number(digits) * 100;
}

export function SaleTicket({
  lines,
  byId,
  onScan,
  onFinished,
  focusScanner,
  shortcuts,
}: {
  lines: PosLine[];
  byId: Map<string, Product>;
  onScan: (code: string) => void;
  /** The ticket was charged or undone: the scanner's last message no longer applies. */
  onFinished: () => void;
  focusScanner: () => void;
  /** F1–F3 pick how it's paid and F4 charges, while this screen is the one showing. */
  shortcuts: boolean;
}) {
  const setQuantity = usePosStore((s) => s.setQuantity);
  const remove = usePosStore((s) => s.remove);
  const clear = usePosStore((s) => s.clear);
  const touched = usePosStore((s) => s.touched);
  const [method, setMethod] = useState<PlayerPaymentMethod | null>(null);
  const [paysWith, setPaysWith] = useState("");
  const [charged, setCharged] = useState<ChargedSale | null>(null);
  // F4 without a payment method shakes the three buttons: bumped to replay it.
  const [nudge, setNudge] = useState(0);
  const paysWithRef = useRef<HTMLInputElement>(null);
  const createSale = useCreateCounterSale();
  const undoSale = useUndoCounterSales();

  const items = lines.filter((line) => byId.has(line.productId));
  const totalCents = items.reduce(
    (sum, line) => sum + byId.get(line.productId)!.priceCents * line.quantity,
    0,
  );
  const units = items.reduce((sum, line) => sum + line.quantity, 0);
  const paysWithCents = method === "CASH" ? parsePesos(paysWith) : null;
  const changeCents = paysWithCents !== null ? paysWithCents - totalCents : null;

  function charge() {
    if (!method || createSale.isPending) return;
    // The store, not this render: F4 commits a quantity being typed right before charging.
    const toCharge = usePosStore
      .getState()
      .lines.cobrar.filter((line) => byId.has(line.productId));
    if (toCharge.length === 0) return;
    const chargedCents = toCharge.reduce(
      (sum, line) => sum + byId.get(line.productId)!.priceCents * line.quantity,
      0,
    );
    const change = paysWithCents !== null ? paysWithCents - chargedCents : null;
    createSale.mutate(
      { items: toCharge.map(({ productId, quantity }) => ({ productId, quantity })), method },
      {
        onSuccess: (sales) => {
          playPosCue("done");
          setCharged({
            ids: sales.map((sale) => sale.id),
            totalCents: chargedCents,
            method,
            changeCents: change !== null && change >= 0 ? change : null,
            at: Date.now(),
          });
          clear("cobrar");
          setMethod(null);
          setPaysWith("");
          onFinished();
          focusScanner();
        },
      },
    );
  }

  function chooseMethod(value: PlayerPaymentMethod) {
    setMethod(value);
    setNudge(0);
    // Cash shows «Paga con» (it focuses itself when it appears); the others go back to scanning.
    if (value === "CASH") paysWithRef.current?.focus();
    else focusScanner();
  }

  useFunctionKeys(shortcuts && items.length > 0, {
    [POS_KEYS.cash]: () => chooseMethod("CASH"),
    [POS_KEYS.qr]: () => chooseMethod("QR"),
    [POS_KEYS.transfer]: () => chooseMethod("TRANSFER"),
    [POS_KEYS.confirm]: () => {
      if (method) {
        charge();
      } else {
        playPosCue("error");
        setNudge((n) => n + 1);
      }
    },
  });

  const showCharged = charged !== null && items.length === 0 && (touched?.at ?? 0) < charged.at;

  if (showCharged) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" />
        <div>
          <p className="text-lg font-semibold">
            Cobrado {formatPrice(charged.totalCents)} {METHOD_WORDS[charged.method]}
          </p>
          {charged.changeCents !== null && charged.changeCents > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              Vuelto: <strong className="text-foreground">{formatPrice(charged.changeCents)}</strong>
            </p>
          )}
          <p className="text-muted-foreground mt-2 text-sm">
            Ya descontamos el stock. Escaneá para empezar otra venta.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          disabled={undoSale.isPending}
          onClick={() =>
            undoSale.mutate(charged.ids, {
              onSuccess: () => {
                playPosCue("undo");
                setCharged(null);
                onFinished();
                focusScanner();
              },
            })
          }
        >
          {undoSale.isPending ? <Loader2 className="animate-spin" /> : <Undo2 />}
          Me equivoqué: anular esta venta
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center text-sm">
        <ScanBarcode className="size-9 opacity-60" />
        <p className="text-foreground font-medium">Escaneá lo que se lleva</p>
        <p>O tocá el producto en la lista. Cada escaneo suma uno.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-sm font-semibold">
          {units === 1 ? "1 producto" : `${units} productos`}
        </p>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            clear("cobrar");
            setMethod(null);
            setPaysWith("");
            focusScanner();
          }}
        >
          <Trash2 />
          Vaciar
        </Button>
      </div>

      <ul className="flex max-h-[42vh] flex-col overflow-y-auto border-y">
        {items.map((line) => {
          const product = byId.get(line.productId)!;
          const warning = !product.isActive
            ? "Está desactivado en el catálogo — se cobra igual"
            : stockWarning(product, line.quantity);
          const flash = touched?.productId === line.productId;
          return (
            <li key={line.productId} className="border-b last:border-b-0">
              {/* Re-keyed on every scan of this product so the flash replays. */}
              <div
                key={flash ? touched?.at : undefined}
                className={cn(
                  "flex flex-col gap-1 px-4 py-2.5 [--flash:var(--color-emerald-500)]",
                  flash && "animate-pos-flash",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {formatPrice(product.priceCents)} c/u
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrice(product.priceCents * line.quantity)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <QuantityStepper
                    value={line.quantity}
                    max={MAX_LINE_QUANTITY.cobrar}
                    label={product.name}
                    onChange={(quantity) => setQuantity("cobrar", line.productId, quantity)}
                    onScan={onScan}
                    onDone={focusScanner}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Quitar ${product.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      remove("cobrar", line.productId);
                      focusScanner();
                    }}
                  >
                    <X />
                  </Button>
                </div>
                {warning && (
                  <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3 shrink-0" />
                    {warning}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(totalCents)}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-xs font-medium">¿Cómo paga?</p>
          <div
            key={nudge}
            className={cn("grid grid-cols-3 gap-2", nudge > 0 && "motion-safe:animate-pos-shake")}
            data-help="pos-pago"
          >
            {METHODS.map(({ value, label, icon: Icon, shortcut }) => (
              <button
                key={value}
                type="button"
                aria-pressed={method === value}
                aria-keyshortcuts={shortcut}
                onClick={() => chooseMethod(value)}
                className={cn(
                  "relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-sm font-medium transition-colors",
                  method === value
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : nudge > 0
                      ? "border-amber-500/60 bg-card/60 text-foreground"
                      : "bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="max-w-full truncate">{label}</span>
                <KeyHint shortcut={shortcut} className="absolute top-1 right-1" />
              </button>
            ))}
          </div>
        </div>

        {method === "CASH" && (
          <div className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 text-sm">
              <span className="text-muted-foreground shrink-0">Paga con $</span>
              <input
                ref={paysWithRef}
                type="text"
                inputMode="numeric"
                autoFocus
                value={paysWith}
                onChange={(e) => setPaysWith(e.target.value.replace(/[^\d.]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const typed = e.currentTarget.value.replace(/\./g, "");
                  // A scan that landed here by mistake goes to the ticket, not into the cash.
                  if (typed.length >= 8) {
                    setPaysWith("");
                    onScan(typed);
                    focusScanner();
                  } else {
                    charge();
                  }
                }}
                placeholder="Opcional"
                aria-label="Con cuánto paga"
                className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-lg border px-2.5 text-sm tabular-nums outline-none focus-visible:ring-3"
              />
            </label>
            {changeCents !== null && (
              <p
                className={cn(
                  "shrink-0 text-sm tabular-nums",
                  changeCents < 0 ? "text-destructive" : "font-semibold",
                )}
              >
                {changeCents < 0
                  ? `Faltan ${formatPrice(-changeCents)}`
                  : `Vuelto ${formatPrice(changeCents)}`}
              </p>
            )}
          </div>
        )}

        <Button
          variant="success"
          className="h-12 text-base"
          disabled={!method || createSale.isPending}
          onClick={charge}
          aria-keyshortcuts={POS_KEYS.confirm}
          data-help="pos-cobrar"
        >
          {createSale.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Cobrando…
            </>
          ) : method ? (
            <>
              Cobrar {formatPrice(totalCents)}
              <KeyHint shortcut={POS_KEYS.confirm} />
            </>
          ) : (
            "Elegí cómo paga"
          )}
        </Button>
      </div>
    </div>
  );
}
