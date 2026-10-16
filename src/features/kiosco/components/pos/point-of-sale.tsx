"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Receipt,
  ScanBarcode,
  ShoppingBag,
  Volume2,
  VolumeX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import { productsService } from "@/services/products.service";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useFeature } from "@/features/plan/hooks/use-plan";
import { PlanUpsell } from "@/features/plan/components/plan-upsell";
import { useTypeToScan } from "@/features/kiosco/hooks/use-type-to-scan";
import { POS_KEYS, useFunctionKeys } from "@/features/kiosco/hooks/use-function-keys";
import { filterProducts, matchByName, resolveEntry } from "@/features/kiosco/lib/pos";
import {
  playPosCue,
  setPosSoundOn,
  usePosSoundOn,
  type PosCue,
} from "@/features/kiosco/lib/pos-sound";
import { KeyHint } from "@/features/kiosco/components/pos/key-hint";
import {
  pulseToneFor,
  ScanPulse,
  shake,
  type Pulse,
} from "@/features/kiosco/components/pos/scan-pulse";
import { ProductGrid } from "@/features/kiosco/components/pos/product-grid";
import { SaleTicket } from "@/features/kiosco/components/pos/sale-ticket";
import { DeliveryTicket } from "@/features/kiosco/components/pos/delivery-ticket";
import { UnknownCodeDialog } from "@/features/kiosco/components/pos/unknown-code-dialog";
import { MAX_LINE_QUANTITY, usePosStore, type PosMode } from "@/stores/pos-store";
import type { Product } from "@/types/api/products";

type Feedback =
  | { tone: "added"; text: string; warning: string | null }
  | { tone: "looking"; code: string }
  | { tone: "unknown"; code: string }
  | { tone: "error"; text: string };

const MODES: {
  value: PosMode;
  label: string;
  hint: string;
  icon: LucideIcon;
  shortcut: string;
}[] = [
  {
    value: "cobrar",
    label: "Cobrar",
    hint: "Le vendés a un cliente",
    icon: ShoppingBag,
    shortcut: POS_KEYS.modeCobrar,
  },
  {
    value: "cargar",
    label: "Cargar stock",
    hint: "Entró mercadería",
    icon: PackagePlus,
    shortcut: POS_KEYS.modeCargar,
  },
];

/** The two modes wear their own color everywhere, so nobody loads stock while meaning to sell. */
const ACCENT: Record<PosMode, { selected: string; icon: string; badge: string; ring: string; header: string }> = {
  cobrar: {
    selected: "border-emerald-500/70 bg-emerald-500/[0.07] ring-3 ring-emerald-500/15",
    icon: "bg-emerald-600 text-white",
    badge: "bg-emerald-600",
    ring: "border-emerald-500/70 ring-3 ring-emerald-500/15",
    header: "bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-300",
  },
  cargar: {
    selected: "border-sky-500/70 bg-sky-500/[0.07] ring-3 ring-sky-500/15",
    icon: "bg-sky-600 text-white",
    badge: "bg-sky-600",
    ring: "border-sky-500/70 ring-3 ring-sky-500/15",
    header: "bg-sky-500/[0.08] text-sky-800 dark:text-sky-300",
  },
};

const PLACEHOLDER: Record<PosMode, string> = {
  cobrar: "Escaneá un producto o escribí su nombre",
  cargar: "Escaneá lo que entró o escribí su nombre",
};

const IDLE_HINT: Record<PosMode, string> = {
  cobrar: "Con el lector: apuntá al código y listo. Si escaneás dos veces el mismo, suma dos.",
  cargar: "Escaneá cada producto que llegó. Si es una caja, escaneá uno y escribí cuántos son.",
};

/** Desktop only: on a tablet, focusing the box would pop the on-screen keyboard every time. */
function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

function FeedbackLine({
  feedback,
  mode,
  onLoadCode,
}: {
  feedback: Feedback | null;
  mode: PosMode;
  onLoadCode: (code: string) => void;
}) {
  if (!feedback) {
    return <p className="text-muted-foreground min-h-6 px-1 text-sm">{IDLE_HINT[mode]}</p>;
  }
  if (feedback.tone === "looking") {
    return (
      <p className="text-muted-foreground flex min-h-6 items-center gap-2 px-1 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Buscando el código {feedback.code}…
      </p>
    );
  }
  if (feedback.tone === "unknown") {
    return (
      <p className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-4 shrink-0" />
        El código <span className="font-mono">{feedback.code}</span> no está cargado.
        <Button variant="outline" size="xs" onClick={() => onLoadCode(feedback.code)}>
          Cargarlo
        </Button>
      </p>
    );
  }
  if (feedback.tone === "error") {
    return (
      <p className="text-destructive flex min-h-6 items-center gap-2 px-1 text-sm">
        <XCircle className="size-4 shrink-0" />
        {feedback.text}
      </p>
    );
  }
  return (
    <p className="flex min-h-6 flex-wrap items-center gap-x-2 px-1 text-sm">
      <CheckCircle2
        className={cn("size-4 shrink-0", mode === "cobrar" ? "text-emerald-600" : "text-sky-600")}
      />
      <span className="font-medium">{feedback.text}</span>
      {feedback.warning && (
        <span className="text-amber-700 dark:text-amber-400">· {feedback.warning}</span>
      )}
    </p>
  );
}

/**
 * The kiosk's point of sale, for whoever is at the counter: a barcode scanner (it types the
 * code and Enter, like a keyboard) or a tap on the product builds a ticket, in one of two
 * modes. «Cobrar» charges it as a counter sale and takes the units out of stock; «Cargar
 * stock» adds a delivery. Both write the same ledger as the rest of the kiosk. A code nobody
 * has yet is linked to its product, or creates it, right there.
 */
export function PointOfSale({ active }: { active: boolean }) {
  const { data: products = [], isLoading } = useProducts();
  const mode = usePosStore((s) => s.mode);
  const setMode = usePosStore((s) => s.setMode);
  const lines = usePosStore((s) => s.lines);
  const add = usePosStore((s) => s.add);
  // A plan without kiosk stock can still load products it already tracks (the API's rule).
  const canTrack = useFeature("kioscoStock").enabled;
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  // The scanner box answers every Enter: a flash when something was added, a shake when not.
  const boxRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const pulseSeq = useRef(0);
  const soundOn = usePosSoundOn();

  const byId = new Map(products.map((p) => [p.id, p]));
  const activeProducts = products.filter((p) => p.isActive);
  const canLoad = (product: Product) => canTrack || product.stockQuantity !== null;
  const pickable = mode === "cargar" ? activeProducts.filter(canLoad) : activeProducts;
  const loadBlocked = mode === "cargar" && !isLoading && !canTrack && pickable.length === 0;
  const searching = query.trim() !== "";
  const nameMatches = searching ? matchByName(pickable, query) : [];
  const highlighted = nameMatches.find((p) => p.id === highlightedId) ?? nameMatches[0] ?? null;
  const quantities = new Map(lines[mode].map((line) => [line.productId, line.quantity]));
  const accent = ACCENT[mode];

  const focusScanner = useCallback(() => {
    if (hasFinePointer()) inputRef.current?.focus();
  }, []);

  useTypeToScan(inputRef, active && unknownCode === null && !loadBlocked, (value) => {
    setQuery(value);
    setHighlightedId(null);
  });

  // Ready to scan as soon as the screen (or the other mode) opens.
  useEffect(() => {
    if (active) focusScanner();
  }, [active, mode, focusScanner]);

  /** What a scan did, for the ears and the eyes. */
  function signal(cue: PosCue) {
    playPosCue(cue);
    const tone = pulseToneFor(cue);
    pulseSeq.current += 1;
    setPulse({ tone, id: pulseSeq.current });
    if (tone !== "ok") shake(boxRef.current);
  }

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
    setQuery("");
    setHighlightedId(null);
  }

  function addProduct(product: Product) {
    if (mode === "cargar" && !canLoad(product)) {
      signal("error");
      setFeedback({
        tone: "error",
        text: `«${product.name}» no lleva control de stock: tu plan no incluye el stock del kiosco.`,
      });
      return;
    }
    // Read the store directly: two scans can land before this screen re-renders.
    const before =
      usePosStore.getState().lines[mode].find((line) => line.productId === product.id)?.quantity ?? 0;
    add(mode, product.id);
    signal("added");
    const now = Math.min(before + 1, MAX_LINE_QUANTITY[mode]);
    setFeedback({
      tone: "added",
      text:
        mode === "cobrar"
          ? `${product.name}: ${now === 1 ? "1 en la venta" : `${now} en la venta`}`
          : `${product.name}: entran ${now}`,
      warning: product.isActive ? null : "está desactivado en el catálogo",
    });
  }

  async function lookUp(code: string) {
    // Not in the catalog this screen loaded: it may have been created on another computer.
    setFeedback({ tone: "looking", code });
    try {
      const product = await productsService.findByBarcode(code);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      addProduct(product);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        signal("unknown");
        setFeedback({ tone: "unknown", code });
        setUnknownCode(code);
      } else {
        signal("error");
        setFeedback({
          tone: "error",
          text: "No pudimos buscar el código. Revisá la conexión y escaneá de nuevo.",
        });
      }
    }
  }

  function handleEntry(raw: string) {
    const entry = resolveEntry(raw, products, {
      pickable,
      highlightedId: highlighted?.id ?? null,
    });
    switch (entry.kind) {
      case "empty":
        return;
      case "code":
      case "name":
        resetInput();
        addProduct(entry.product);
        return;
      case "unknown-code":
        resetInput();
        void lookUp(entry.code);
        return;
      case "no-match":
        signal("error");
        setFeedback({ tone: "error", text: `No hay ningún producto que se llame «${entry.text}».` });
    }
  }

  function pick(product: Product) {
    resetInput();
    addProduct(product);
    focusScanner();
  }

  function moveHighlight(step: 1 | -1) {
    if (nameMatches.length < 2) return;
    const index = nameMatches.findIndex((p) => p.id === highlighted?.id);
    const next = (index + step + nameMatches.length) % nameMatches.length;
    setHighlightedId(nameMatches[next].id);
  }

  function switchMode(next: PosMode) {
    if (next === mode) return;
    resetInput();
    setFeedback(null);
    setPulse(null);
    setMode(next);
  }

  useFunctionKeys(active, {
    [POS_KEYS.modeCobrar]: () => switchMode("cobrar"),
    [POS_KEYS.modeCargar]: () => switchMode("cargar"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="¿Qué vas a hacer?"
        className="grid flex-1 grid-cols-2 gap-2 sm:max-w-xl"
        data-help="pos-modo"
      >
        {MODES.map(({ value, label, hint, icon: Icon, shortcut }) => {
          const selected = mode === value;
          const count = lines[value].length;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              aria-keyshortcuts={shortcut}
              onClick={() => switchMode(value)}
              data-help={`pos-modo-${value}`}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 sm:px-4 sm:py-3",
                selected ? ACCENT[value].selected : "bg-card/50 hover:bg-card text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selected ? ACCENT[value].icon : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={cn("font-semibold", selected && "text-foreground")}>{label}</span>
                <span className="text-muted-foreground hidden truncate text-xs sm:block">{hint}</span>
              </span>
              <KeyHint shortcut={shortcut} className="ml-auto self-end" />
              {count > 0 && !selected && (
                <span
                  className={cn(
                    "absolute top-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white tabular-nums",
                    ACCENT[value].badge,
                  )}
                  title={value === "cobrar" ? "Hay una venta sin cobrar" : "Hay una entrada sin sumar"}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={soundOn}
          title={soundOn ? "Suena con cada escaneo: tocá para silenciarlo" : "Sin sonido: tocá para activarlo"}
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => {
            setPosSoundOn(!soundOn);
            focusScanner();
          }}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
          <span className="hidden sm:inline">{soundOn ? "Sonido" : "Sin sonido"}</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:grid-rows-[auto_1fr]">
        <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-1">
          <div
            ref={boxRef}
            className={cn(
              "bg-card/70 relative rounded-xl border-2 transition-all duration-200",
              focused ? accent.ring : "border-input",
            )}
            data-help="pos-lector"
          >
            <ScanPulse
              pulse={pulse}
              okTint={
                mode === "cobrar"
                  ? "[--flash:var(--color-emerald-500)]"
                  : "[--flash:var(--color-sky-500)]"
              }
            />
            <ScanBarcode
              className={cn(
                "pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 transition-colors",
                focused ? (mode === "cobrar" ? "text-emerald-600" : "text-sky-600") : "text-muted-foreground",
              )}
            />
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="enter"
              aria-label={PLACEHOLDER[mode]}
              placeholder={PLACEHOLDER[mode]}
              disabled={loadBlocked}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setHighlightedId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEntry(e.currentTarget.value);
                } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  moveHighlight(e.key === "ArrowDown" ? 1 : -1);
                } else if (e.key === "Escape") {
                  resetInput();
                  setFeedback(null);
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="placeholder:text-muted-foreground/80 h-14 w-full rounded-xl bg-transparent pr-4 pl-13 text-base outline-none disabled:cursor-not-allowed sm:pr-40 sm:text-lg"
            />
            {focused && (
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-1.5 text-xs sm:flex">
                <span
                  className={cn(
                    "size-2 animate-pulse rounded-full",
                    mode === "cobrar" ? "bg-emerald-500" : "bg-sky-500",
                  )}
                />
                Listo para escanear
              </span>
            )}
          </div>
          <FeedbackLine
            feedback={feedback}
            mode={mode}
            onLoadCode={(code) => setUnknownCode(code)}
          />
        </div>

        <aside
          className="bg-card/70 overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_var(--glass-highlight)] lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
          aria-label={mode === "cobrar" ? "Venta" : "Entrada de mercadería"}
        >
          <div
            className={cn(
              "flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold",
              accent.header,
            )}
          >
            {mode === "cobrar" ? <Receipt className="size-4" /> : <PackagePlus className="size-4" />}
            {mode === "cobrar" ? "Venta" : "Entrada de mercadería"}
          </div>
          {loadBlocked ? (
            <div className="p-4">
              <PlanUpsell feature="kioscoStock">
                Cargar la mercadería con el lector y llevar el stock al día.
              </PlanUpsell>
            </div>
          ) : mode === "cobrar" ? (
            <SaleTicket
              lines={lines.cobrar}
              byId={byId}
              onScan={handleEntry}
              onFinished={() => setFeedback(null)}
              focusScanner={focusScanner}
              shortcuts={active}
            />
          ) : (
            <DeliveryTicket
              lines={lines.cargar}
              byId={byId}
              onScan={handleEntry}
              onFinished={() => setFeedback(null)}
              focusScanner={focusScanner}
              shortcuts={active}
            />
          )}
        </aside>

        {!loadBlocked && (
          <section className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
            {isLoading ? (
              <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Cargando productos…
              </p>
            ) : activeProducts.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
                Todavía no hay productos. Escaneá uno y lo creás ahí mismo con su código.
              </p>
            ) : (
              <>
                <h2 className="text-muted-foreground px-1 text-xs font-medium">
                  {searching ? "Productos que coinciden" : "¿No tiene código? Tocá el producto"}
                </h2>
                <ProductGrid
                  products={filterProducts(activeProducts, query)}
                  searching={searching}
                  mode={mode}
                  quantities={quantities}
                  highlightedId={highlighted?.id ?? null}
                  isPickable={(product) => mode === "cobrar" || canLoad(product)}
                  onPick={pick}
                />
              </>
            )}
          </section>
        )}
      </div>

      <UnknownCodeDialog
        code={unknownCode}
        mode={mode}
        products={products}
        onClose={() => {
          setUnknownCode(null);
          focusScanner();
        }}
        onResolved={(product) => {
          setUnknownCode(null);
          addProduct(product);
          focusScanner();
        }}
      />
    </div>
  );
}
