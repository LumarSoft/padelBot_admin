"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, PackageOpen, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRegisterPurchase } from "@/features/kiosco/hooks/use-stock";
import { POS_KEYS, useFunctionKeys } from "@/features/kiosco/hooks/use-function-keys";
import { playPosCue } from "@/features/kiosco/lib/pos-sound";
import { QuantityStepper } from "@/features/kiosco/components/pos/quantity-stepper";
import { KeyHint } from "@/features/kiosco/components/pos/key-hint";
import { MAX_LINE_QUANTITY, usePosStore, type PosLine } from "@/stores/pos-store";
import type { Product } from "@/types/api/products";
import type { StockProduct } from "@/types/api/stock";

interface Loaded {
  units: number;
  products: StockProduct[];
  /** When it was loaded: a later scan starts a new delivery and hides this. */
  at: number;
}

const unitsLabel = (n: number) => (n === 1 ? "1 unidad" : `${n} unidades`);

/**
 * "Cargar stock": what came in, product by product, with what there will be after it. Nothing
 * moves until «Sumar al stock»: then it's one delivery (PURCHASE lines in the ledger).
 */
export function DeliveryTicket({
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
  /** The delivery was added to stock: the scanner's last message no longer applies. */
  onFinished: () => void;
  focusScanner: () => void;
  /** F4 adds it to stock, while this screen is the one showing. */
  shortcuts: boolean;
}) {
  const setQuantity = usePosStore((s) => s.setQuantity);
  const remove = usePosStore((s) => s.remove);
  const clear = usePosStore((s) => s.clear);
  const touched = usePosStore((s) => s.touched);
  const note = usePosStore((s) => s.deliveryNote);
  const setNote = usePosStore((s) => s.setDeliveryNote);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const registerPurchase = useRegisterPurchase();

  const items = lines.filter((line) => byId.has(line.productId));
  const units = items.reduce((sum, line) => sum + line.quantity, 0);

  function submit() {
    if (registerPurchase.isPending) return;
    // The store, not this render: F4 commits a quantity being typed right before loading.
    const toLoad = usePosStore
      .getState()
      .lines.cargar.filter((line) => byId.has(line.productId));
    if (toLoad.length === 0) return;
    const loadedUnits = toLoad.reduce((sum, line) => sum + line.quantity, 0);
    registerPurchase.mutate(
      {
        items: toLoad.map(({ productId, quantity }) => ({ productId, quantity })),
        note: note.trim() || undefined,
      },
      {
        onSuccess: (products) => {
          playPosCue("done");
          setLoaded({ units: loadedUnits, products, at: Date.now() });
          clear("cargar");
          onFinished();
          focusScanner();
        },
      },
    );
  }

  useFunctionKeys(shortcuts && items.length > 0, { [POS_KEYS.confirm]: submit });

  const showLoaded = loaded !== null && items.length === 0 && (touched?.at ?? 0) < loaded.at;

  if (showLoaded) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <CheckCircle2 className="size-10 text-sky-600" />
        <p className="text-lg font-semibold">Entraron {unitsLabel(loaded.units)}</p>
        <ul className="text-muted-foreground flex w-full max-w-xs flex-col gap-1 text-sm">
          {loaded.products.map((product) => (
            <li key={product.id} className="flex justify-between gap-3">
              <span className="truncate">{product.name}</span>
              <span className="text-foreground shrink-0 font-medium tabular-nums">
                quedan {product.stockQuantity}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">
          ¿Algo no coincide con la góndola? Corregilo con «Contar stock».
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center text-sm">
        <PackageOpen className="size-9 opacity-60" />
        <p className="text-foreground font-medium">Escaneá lo que entró</p>
        <p>
          ¿Llegó una caja? Escaneá una unidad y escribí cuántas son. Nada se suma hasta que
          toques «Sumar al stock».
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-sm font-semibold">
          {items.length === 1 ? "1 producto" : `${items.length} productos`} ·{" "}
          {unitsLabel(units)}
        </p>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            clear("cargar");
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
          const before = product.stockQuantity;
          const flash = touched?.productId === line.productId;
          return (
            <li key={line.productId} className="border-b last:border-b-0">
              {/* Re-keyed on every scan of this product so the flash replays. */}
              <div
                key={flash ? touched?.at : undefined}
                className={cn(
                  "flex flex-col gap-1.5 px-4 py-2.5 [--flash:var(--color-sky-500)]",
                  flash && "animate-pos-flash",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{product.name}</p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Quitar ${product.name}`}
                    className="text-muted-foreground hover:text-destructive -mr-1"
                    onClick={() => {
                      remove("cargar", line.productId);
                      focusScanner();
                    }}
                  >
                    <X />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <QuantityStepper
                    value={line.quantity}
                    max={MAX_LINE_QUANTITY.cargar}
                    label={product.name}
                    onChange={(quantity) => setQuantity("cargar", line.productId, quantity)}
                    onScan={onScan}
                    onDone={focusScanner}
                  />
                  <p className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                    {before === null ? (
                      <>
                        Empieza a contar:
                        <span className="text-foreground font-semibold">quedan {line.quantity}</span>
                      </>
                    ) : (
                      <>
                        Hay {before}
                        <ArrowRight className="size-3" />
                        <span className="text-foreground font-semibold">
                          quedan {before + line.quantity}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 p-4">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Proveedor o remito (opcional)"
          aria-label="Proveedor o remito"
          className="h-9"
        />
        <Button
          className="h-12 from-sky-500 to-sky-600 text-base text-white dark:from-sky-500 dark:to-sky-600"
          disabled={registerPurchase.isPending}
          onClick={submit}
          aria-keyshortcuts={POS_KEYS.confirm}
          data-help="pos-sumar-stock"
        >
          {registerPurchase.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              Sumar {unitsLabel(units)} al stock
              <KeyHint shortcut={POS_KEYS.confirm} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
