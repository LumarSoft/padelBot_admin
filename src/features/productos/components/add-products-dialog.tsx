"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Landmark,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ScanBarcode,
  ShoppingBasket,
  Trash2,
  X,
  XCircle,
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
import { ApiError } from "@/lib/api/api-error";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useSetBookingProducts } from "@/features/reservas/hooks/use-bookings";
import { bookingsService } from "@/services/bookings.service";
import { productsService } from "@/services/products.service";
import { stockWarning } from "@/features/kiosco/lib/stock-warning";
import { matchByName, resolveEntry } from "@/features/kiosco/lib/pos";
import { useTypeToScan } from "@/features/kiosco/hooks/use-type-to-scan";
import { UnknownCodeDialog } from "@/features/kiosco/components/pos/unknown-code-dialog";
import { playPosCue, type PosCue } from "@/features/kiosco/lib/pos-sound";
import {
  pulseToneFor,
  ScanPulse,
  shake,
  type Pulse,
} from "@/features/kiosco/components/pos/scan-pulse";
import { isLowStock } from "@/types/api/stock";
import { PlanUpsell } from "@/features/plan/components/plan-upsell";
import { useFeature } from "@/features/plan/hooks/use-plan";
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

/** Who pays what gets added (scanned, typed or picked): split among all four, or one player. */
type ChargeTo = "all" | 1 | 2 | 3 | 4;

const CHARGE_TO_OPTIONS: ChargeTo[] = ["all", 1, 2, 3, 4];

/** Both sorted, as the lines keep them. */
function samePlayers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((player, i) => player === b[i]);
}

type ScanFeedback =
  /** A unit went on the line of this product and these players (read back from the lines);
   *  `id` is new on every unit, to replay the line's flash. */
  | { tone: "added"; productId: string; players: number[]; id: string }
  | { tone: "looking"; code: string }
  | { tone: "unknown"; code: string }
  | { tone: "error"; text: string };

/** Desktop only: on a tablet, focusing the box would pop the on-screen keyboard every time. */
function focusOnDesktop(input: HTMLInputElement | null) {
  if (input && window.matchMedia("(pointer: fine)").matches) input.focus();
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
  const scanRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [scanFocused, setScanFocused] = useState(false);
  const [chargeTo, setChargeTo] = useState<ChargeTo>("all");
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  // Same answer as the kiosk's scanner box: a sound, plus a flash (added) or a shake (not).
  const scanBoxRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const pulseSeq = useRef(0);

  // Server truth for payments/seña/settled — the draft lines only affect "debe".
  const accountQuery = useQuery({
    queryKey: queryKeys.bookings.account(bookingId),
    queryFn: () => bookingsService.getAccount(bookingId),
    enabled: open,
  });
  const serverAccount = accountQuery.data ?? null;

  const [payingSlot, setPayingSlot] = useState<number | null>(null);
  // Without split payment the desk charges the turno in one payment (the API refuses a share).
  const canSplit = useFeature("splitPayment").enabled;
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
      playPosCue("done");
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

  // Units this bill already took out of stock when it was last saved — still available to it.
  const savedQuantityById = currentProducts.reduce<Map<string, number>>(
    (acc, entry) =>
      acc.set(entry.product.id, (acc.get(entry.product.id) ?? 0) + entry.quantity),
    new Map(),
  );
  const draftQuantityById = lines.reduce<Map<string, number>>(
    (acc, line) => acc.set(line.productId, (acc.get(line.productId) ?? 0) + line.quantity),
    new Map(),
  );
  const warningFor = (productId: string): string | null =>
    stockWarning(
      activeProducts.find((p) => p.id === productId),
      draftQuantityById.get(productId) ?? 0,
      savedQuantityById.get(productId) ?? 0,
    );
  /** Short hint for the picker: only for tracked products that are running out. */
  const pickerHint = (product: Product): string => {
    if (product.stockQuantity === null || !isLowStock(product)) return "";
    return product.stockQuantity <= 0 ? " · sin stock" : ` · quedan ${product.stockQuantity}`;
  };

  const account = computeBookingAccount(
    courtPriceCents,
    lines.map((line) => ({
      unitPriceCents: priceForProduct(line.productId),
      quantity: line.quantity,
      players: line.players,
    })),
  );

  // The scanner box: a scan (the code and Enter, typed by the scanner) or a name typed by hand.
  // Keys typed anywhere else in this dialog are sent to it, so the scanner's Enter can never
  // press «Guardar y cerrar» or a payment button that happens to have the focus.
  useTypeToScan(
    scanRef,
    open && unknownCode === null,
    (value) => {
      setQuery(value);
      setHighlightedId(null);
    },
    "dialog",
  );

  // The first open of the session waits for the catalog with the box disabled.
  useEffect(() => {
    if (open && !isLoading) focusOnDesktop(scanRef.current);
  }, [open, isLoading]);

  const nameMatches = query.trim() ? matchByName(activeProducts, query).slice(0, 6) : [];
  const highlighted =
    nameMatches.find((p) => p.id === highlightedId) ?? nameMatches[0] ?? null;
  const chargePlayers = canSplit && chargeTo !== "all" ? [chargeTo] : ALL_PLAYERS;

  /** What a scan did, for the ears and the eyes. */
  function signal(cue: PosCue) {
    playPosCue(cue);
    const tone = pulseToneFor(cue);
    pulseSeq.current += 1;
    setPulse({ tone, id: pulseSeq.current });
    if (tone !== "ok") shake(scanBoxRef.current);
  }

  /** One more unit on the line of this product and these players — a new line the first time. */
  function addUnit(product: Product) {
    if (!product.isActive) {
      signal("error");
      setFeedback({
        tone: "error",
        text: `«${product.name}» está desactivado en el catálogo: no se puede cargar.`,
      });
      return;
    }
    const players = chargePlayers;
    const fresh: DraftLine = { key: nextDraftKey(), productId: product.id, quantity: 1, players };
    setLines((prev) => {
      const same = prev.find(
        (line) => line.productId === product.id && samePlayers(line.players, players),
      );
      return same
        ? prev.map((line) =>
            line === same ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...prev, fresh];
    });
    signal("added");
    setFeedback({ tone: "added", productId: product.id, players, id: fresh.key });
  }

  /** A product this bill just learned about (its code saved, or found on the server) shows its
   *  name and price on the spot, before the catalog refetches. */
  function rememberProduct(product: Product) {
    queryClient.setQueryData<Product[]>(queryKeys.products.list, (old) =>
      !old
        ? old
        : old.some((p) => p.id === product.id)
          ? old.map((p) => (p.id === product.id ? product : p))
          : [...old, product],
    );
  }

  function resetScan() {
    if (scanRef.current) scanRef.current.value = "";
    setQuery("");
    setHighlightedId(null);
  }

  async function lookUp(code: string) {
    // Not in the catalog this dialog loaded: it may have been created on another computer.
    setFeedback({ tone: "looking", code });
    try {
      const product = await productsService.findByBarcode(code);
      rememberProduct(product);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      addUnit(product);
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
    const entry = resolveEntry(raw, catalog ?? [], {
      pickable: activeProducts,
      highlightedId: highlighted?.id ?? null,
    });
    switch (entry.kind) {
      case "empty":
        return;
      case "code":
      case "name":
        resetScan();
        addUnit(entry.product);
        return;
      case "unknown-code":
        resetScan();
        void lookUp(entry.code);
        return;
      case "no-match":
        signal("error");
        setFeedback({ tone: "error", text: `No hay ningún producto que se llame «${entry.text}».` });
    }
  }

  function pick(product: Product) {
    resetScan();
    addUnit(product);
    focusOnDesktop(scanRef.current);
  }

  function moveHighlight(step: 1 | -1) {
    if (nameMatches.length < 2) return;
    const index = nameMatches.findIndex((p) => p.id === highlighted?.id);
    const next = (index + step + nameMatches.length) % nameMatches.length;
    setHighlightedId(nameMatches[next].id);
  }

  const addedLine =
    feedback?.tone === "added"
      ? lines.find(
          (line) =>
            line.productId === feedback.productId && samePlayers(line.players, feedback.players),
        )
      : undefined;

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
      <DialogContent
        // Anchored to the top, not centered: when the bill grows (a scan, a payment) only its
        // bottom moves, and what's under the pointer stays put.
        className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 sm:top-[5dvh] sm:max-h-[90dvh] sm:max-w-4xl"
        // Ready to scan; opened by touch, Base UI focuses the popup so no keyboard pops up.
        initialFocus={(openType) => (openType === "touch" ? true : scanRef.current)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5" />
            Cuenta del turno — {playerName}
          </DialogTitle>
          <DialogDescription>
            Escaneá o elegí los consumos y marcá quién paga cada cosa; a la derecha registrás
            los pagos. Cuando la cuenta queda en cero, el turno se marca finalizado solo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Columna izquierda: la cuenta (cancha + consumos) ── */}
          <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2" data-help="cuenta-consumo">
              {canSplit && (
                <div
                  role="group"
                  aria-label="A quién se le carga lo que agregás"
                  className="flex flex-wrap items-center gap-1"
                >
                  <span className="text-muted-foreground mr-1 text-xs">Cargar a:</span>
                  {CHARGE_TO_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={chargeTo === option}
                      onClick={() => {
                        setChargeTo(option);
                        focusOnDesktop(scanRef.current);
                      }}
                      className={cn(
                        "h-7 rounded-md border px-2 text-xs font-semibold transition-colors",
                        chargeTo === option
                          ? "border-brand bg-brand text-brand-foreground shadow-sm"
                          : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                      )}
                    >
                      {option === "all" ? "Todos" : `J${option}`}
                    </button>
                  ))}
                </div>
              )}

              <div
                ref={scanBoxRef}
                className={cn(
                  "relative rounded-lg border-2 transition-colors",
                  scanFocused ? "border-brand/70 ring-3 ring-brand/15" : "border-input",
                )}
                data-help="cuenta-lector"
              >
                <ScanPulse pulse={pulse} okTint="" />
                <ScanBarcode
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 transition-colors",
                    scanFocused ? "text-brand" : "text-muted-foreground",
                  )}
                />
                <input
                  ref={scanRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="enter"
                  aria-label="Escaneá un producto o escribí su nombre"
                  placeholder={
                    isLoading ? "Cargando catálogo…" : "Escaneá un producto o escribí su nombre"
                  }
                  disabled={isLoading}
                  onInput={(e) => {
                    setQuery(e.currentTarget.value);
                    setHighlightedId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // Never the dialog's: the scanner ends every code with an Enter.
                      e.preventDefault();
                      handleEntry(e.currentTarget.value);
                    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      moveHighlight(e.key === "ArrowDown" ? 1 : -1);
                    } else if (e.key === "Escape" && e.currentTarget.value !== "") {
                      // Clears the box; only an empty box lets Escape close the bill.
                      e.preventDefault();
                      e.stopPropagation();
                      resetScan();
                    }
                  }}
                  onFocus={() => setScanFocused(true)}
                  onBlur={() => setScanFocused(false)}
                  className="placeholder:text-muted-foreground/80 h-11 w-full rounded-lg bg-transparent pr-8 pl-10 text-sm outline-none disabled:cursor-not-allowed"
                />
                {scanFocused && (
                  <span
                    className="bg-brand pointer-events-none absolute top-1/2 right-3 size-2 -translate-y-1/2 animate-pulse rounded-full"
                    title="Listo para escanear"
                  />
                )}
              </div>

              {nameMatches.length > 0 && (
                <ul
                  aria-label="Productos que coinciden"
                  className="flex flex-col gap-0.5 rounded-lg border p-1"
                >
                  {nameMatches.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => pick(product)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                          product.id === highlighted?.id ? "bg-muted" : "hover:bg-muted/60",
                        )}
                      >
                        <span className="min-w-0 truncate font-medium">{product.name}</span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {formatPrice(product.priceCents)}
                          {pickerHint(product)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <ScanFeedbackLine
                feedback={feedback}
                productName={
                  feedback?.tone === "added"
                    ? (catalog ?? []).find((p) => p.id === feedback.productId)?.name ?? "Producto"
                    : ""
                }
                quantity={addedLine?.quantity ?? null}
                showPlayers={canSplit}
                warning={feedback?.tone === "added" ? warningFor(feedback.productId) : null}
                onLoadCode={setUnknownCode}
              />

              <Select
                value={picker}
                onValueChange={(value) => {
                  const product = activeProducts.find((p) => p.id === value);
                  if (product) addUnit(product);
                  setPicker("");
                }}
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
                            {pickerHint(product)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Cancha {formatPrice(courtPriceCents)} ÷ 4
              </span>
              <span className="font-medium tabular-nums">
                {formatPrice(account.courtSharesCents[0])} c/u
              </span>
            </div>

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
                  const warning = warningFor(line.productId);
                  const flash = feedback?.tone === "added" && line === addedLine;
                  return (
                    <div
                      // Re-keyed on every unit added to it, so the flash replays.
                      key={flash ? `${line.key}@${feedback.id}` : line.key}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border px-3 py-2",
                        flash && "animate-pos-flash",
                      )}
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
                      {warning && (
                        <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-3 shrink-0" />
                          {warning}
                        </p>
                      )}
                      {canSplit && (
                        <PlayerToggles
                          players={line.players}
                          lineTotalCents={lineTotalCents}
                          onChange={(players) => updateLine(line.key, { players })}
                          disabled={setProducts.isPending}
                        />
                      )}
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
            canSplit={canSplit}
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
          <Button onClick={handleSave} disabled={setProducts.isPending} data-help="cuenta-guardar">
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

        {/* Inside the bill's popup, so it opens nested on top of it. */}
        <UnknownCodeDialog
          code={unknownCode}
          mode="cuenta"
          products={catalog ?? []}
          onClose={() => {
            setUnknownCode(null);
            focusOnDesktop(scanRef.current);
          }}
          onResolved={(product) => {
            setUnknownCode(null);
            rememberProduct(product);
            addUnit(product);
            focusOnDesktop(scanRef.current);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

const SCAN_IDLE_HINT =
  "Con el lector: apuntá al código y listo. Si escaneás dos veces lo mismo, suma dos.";

/** What the last scan did, right under the box (same tones as the kiosk's point of sale). */
function ScanFeedbackLine({
  feedback,
  productName,
  quantity,
  showPlayers,
  warning,
  onLoadCode,
}: {
  feedback: ScanFeedback | null;
  productName: string;
  /** Units now on the line the last product went to; null once that line is gone. */
  quantity: number | null;
  showPlayers: boolean;
  warning: string | null;
  onLoadCode: (code: string) => void;
}) {
  if (!feedback || (feedback.tone === "added" && quantity === null)) {
    return <p className="text-muted-foreground min-h-5 px-1 text-xs">{SCAN_IDLE_HINT}</p>;
  }
  if (feedback.tone === "looking") {
    return (
      <p className="text-muted-foreground flex min-h-5 items-center gap-1.5 px-1 text-xs">
        <Loader2 className="size-3.5 animate-spin" />
        Buscando el código {feedback.code}…
      </p>
    );
  }
  if (feedback.tone === "unknown") {
    return (
      <p className="flex min-h-5 flex-wrap items-center gap-x-1.5 gap-y-1 px-1 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-3.5 shrink-0" />
        El código <span className="font-mono">{feedback.code}</span> no está cargado.
        <Button variant="outline" size="xs" onClick={() => onLoadCode(feedback.code)}>
          Cargarlo
        </Button>
      </p>
    );
  }
  if (feedback.tone === "error") {
    return (
      <p className="text-destructive flex min-h-5 items-center gap-1.5 px-1 text-xs">
        <XCircle className="size-3.5 shrink-0" />
        {feedback.text}
      </p>
    );
  }
  const onePlayer = feedback.players.length === 1 ? feedback.players[0] : null;
  return (
    <p className="flex min-h-5 flex-wrap items-center gap-x-1.5 px-1 text-xs">
      <CheckCircle2 className="text-brand size-3.5 shrink-0" />
      <span className="font-medium">
        {productName}: {quantity} en la cuenta
        {showPlayers && onePlayer !== null && ` · lo paga J${onePlayer}`}
      </span>
      {warning && <span className="text-amber-700 dark:text-amber-400">· {warning}</span>}
    </p>
  );
}

const METHODS: {
  value: PlayerPaymentMethod;
  label: string;
  icon: typeof Banknote;
  /** Tailwind classes for the action button (idle state). */
  btnClass: string;
  /** Tailwind classes for the badge in the payment history. */
  badgeClass: string;
  /** Icon color class for the badge. */
  iconClass: string;
}[] = [
  {
    value: "CASH",
    label: "Efectivo",
    icon: Banknote,
    btnClass:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 backdrop-blur-sm",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "QR",
    label: "QR",
    icon: QrCode,
    btnClass:
      "border-violet-500/40 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30",
    badgeClass:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 backdrop-blur-sm",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
  {
    value: "TRANSFER",
    label: "Transf.",
    icon: Landmark,
    btnClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    badgeClass:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 backdrop-blur-sm",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
];

const METHOD_LABELS: Record<PlayerPaymentMethod, string> = {
  CASH: "Efectivo",
  QR: "QR",
  TRANSFER: "Transferencia",
};

/** Quick lookup for badge/button metadata by method value. */
const METHOD_META = Object.fromEntries(
  METHODS.map((m) => [m.value, m]),
) as Record<PlayerPaymentMethod, (typeof METHODS)[number]>;

/**
 * The settlement half of the bill: what each player owes (from the on-screen draft),
 * what they already put in (server truth — payments + la seña de J1), one-tap charge
 * buttons for the remainder, undo, and the "turno finalizado" state.
 */
function SettlementSection({
  canSplit,
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
  /** False on a plan without split payment: one payment for the whole bill. */
  canSplit: boolean;
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
    <div className="flex flex-col gap-2" data-help={settled ? undefined : "cuenta-cobros"}>
      {!canSplit && (
        <WholeBillPayment
          payments={serverAccount.payments}
          remainingCents={totalRemaining}
          paying={payingSlot !== null && busy}
          busy={busy}
          onPay={(amountCents, method) => onPay(1, amountCents, method)}
          onUndo={onUndo}
        />
      )}
      {canSplit && ALL_PLAYERS.map((slot) => {
        const owes = draftOwes[slot - 1];
        const paid = paidBySlot[slot - 1];
        const remaining = Math.max(0, owes - paid);
        const isJ1 = slot === 1;
        const paidBesidesDeposit =
          paid - (isJ1 ? serverAccount.depositPaidCents : 0);
        // Payments that belong to this specific player slot
        const slotPayments = serverAccount.payments.filter(
          (p) => p.playerSlot === slot,
        );
        return (
          <div
            key={slot}
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border px-3 py-2",
              remaining === 0 && "border-emerald-500/40 bg-emerald-500/[0.04]",
            )}
          >
            {/* ── Row 1: name + status ── */}
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

            {/* ── Row 2: debt info ── */}
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

            {/* ── Inline payment badges (one per registered payment) ── */}
            {slotPayments.length > 0 && (
              <div className="flex flex-col gap-1">
                {slotPayments.map((payment) => {
                  const meta = METHOD_META[payment.method];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={payment.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs backdrop-blur-sm",
                        meta.badgeClass,
                      )}
                    >
                      <Icon className={cn("size-3 shrink-0", meta.iconClass)} />
                      <span className="font-semibold tabular-nums">
                        {formatPrice(payment.amountCents)}
                      </span>
                      {/* Method pill */}
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                          meta.badgeClass,
                        )}
                      >
                        {METHOD_LABELS[payment.method]}
                      </span>
                      {/* Undo button */}
                      <button
                        type="button"
                        onClick={() => onUndo(payment.id)}
                        disabled={busy}
                        title="Deshacer este pago"
                        className="text-current/40 hover:text-destructive ml-auto shrink-0 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pay buttons. Hidden, not removed, once the player is al día: moving a
                consumo between players must not change the card's height (and jump the bill). ── */}
            <div className={cn("flex items-center gap-1", remaining === 0 && "invisible")}>
              {METHODS.map(({ value, label, icon: Icon, btnClass }) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  data-help={remaining > 0 ? "cuenta-cobrar" : undefined}
                  className={cn("h-7 px-2 text-xs transition-colors", btnClass)}
                  disabled={busy || remaining === 0}
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
          </div>
        );
      })}

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

/**
 * The bill on a plan without split payment: every payment registered so far and one set of
 * buttons that charges the whole remainder — the turno paid in one go, whoever pays it.
 */
function WholeBillPayment({
  payments,
  remainingCents,
  paying,
  busy,
  onPay,
  onUndo,
}: {
  payments: BookingAccountView["payments"];
  remainingCents: number;
  paying: boolean;
  busy: boolean;
  onPay: (amountCents: number, method: PlayerPaymentMethod) => void;
  onUndo: (paymentId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border px-3 py-2">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center gap-2 text-xs">
          <span className="font-semibold tabular-nums">{formatPrice(payment.amountCents)}</span>
          <span className="text-muted-foreground">{METHOD_LABELS[payment.method]}</span>
          <button
            type="button"
            onClick={() => onUndo(payment.id)}
            disabled={busy}
            title="Deshacer este pago"
            className="text-muted-foreground hover:text-destructive ml-auto shrink-0 transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      {/* Hidden, not removed, at $0: the bill keeps its height while consumos change. */}
      <div className={cn("flex flex-wrap items-center gap-1", remainingCents === 0 && "invisible")}>
        <span className="mr-1 text-sm font-medium">
          Cobrar {formatPrice(remainingCents)}
        </span>
        {METHODS.map(({ value, label, icon: Icon, btnClass }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            data-help={remainingCents > 0 ? "cuenta-cobrar" : undefined}
            className={cn("h-7 px-2 text-xs transition-colors", btnClass)}
            disabled={busy || remainingCents === 0}
            title={`Registrar ${formatPrice(remainingCents)} en ${label.toLowerCase()}`}
            onClick={() => onPay(remainingCents, value)}
          >
            {paying ? <Loader2 className="size-3 animate-spin" /> : <Icon className="size-3" />}
            {label}
          </Button>
        ))}
      </div>
      <PlanUpsell feature="splitPayment">Cobrarle a cada jugador su parte.</PlanUpsell>
    </div>
  );
}
