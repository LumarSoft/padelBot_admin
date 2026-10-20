"use client";

import { useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Banknote,
  Beer,
  Check,
  Droplet,
  Landmark,
  QrCode,
  ScanBarcode,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { PadelBall } from "@/components/ui/padel-ball";
import { playPosCue, type PosCue } from "@/features/kiosco/lib/pos-sound";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion";
import { Container, DisplayTitle, Eyebrow } from "./landing-ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ProductKey = "agua" | "isotonica" | "pelotas" | "cerveza";
type SceneKey = "mostrador" | "cuenta";

interface Product {
  name: string;
  size: string;
  priceCents: number;
  /** First 12 digits of the EAN-13; the check digit is computed. */
  code: string;
  icon: ReactNode;
  /** Icon chip colors on the white label. */
  tint: string;
}

const PRODUCTS: Record<ProductKey, Product> = {
  agua: {
    name: "Agua mineral",
    size: "500 ml",
    priceCents: 150_000,
    code: "779123400101",
    icon: <Droplet className="size-4" strokeWidth={2.5} />,
    tint: "bg-sky-500/15 text-sky-600",
  },
  isotonica: {
    name: "Bebida isotónica",
    size: "500 ml",
    priceCents: 280_000,
    code: "779123400205",
    icon: <Zap className="size-4" strokeWidth={2.5} />,
    tint: "bg-amber-400/20 text-amber-600",
  },
  pelotas: {
    name: "Tubo de pelotas",
    size: "x3",
    priceCents: 1_200_000,
    code: "779123400309",
    icon: <PadelBall className="size-5" />,
    tint: "bg-ink/8",
  },
  cerveza: {
    name: "Cerveza",
    size: "473 ml",
    priceCents: 320_000,
    code: "779123400413",
    icon: <Beer className="size-4" strokeWidth={2.5} />,
    tint: "bg-orange-400/20 text-orange-600",
  },
};

/** What each scene scans, in order. Scanning a product again adds one to its line. */
const SCANS: Record<SceneKey, ProductKey[]> = {
  mostrador: ["agua", "isotonica", "agua", "pelotas"],
  cuenta: ["cerveza", "cerveza", "isotonica"],
};

const PAID_WITH_CENTS = 2_000_000;

function ticketLines(scans: ProductKey[]) {
  const counts = new Map<ProductKey, number>();
  for (const key of scans) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts].map(([key, count]) => ({ key, count }));
}

function ticketTotal(scans: ProductKey[]) {
  return scans.reduce((sum, key) => sum + PRODUCTS[key].priceCents, 0);
}

const SALE_TOTAL = ticketTotal(SCANS.mostrador);
const BILL_TOTAL = ticketTotal(SCANS.cuenta);

// ── EAN-13: real bars, so the labels read like the products on the shelf ──

const L_CODES = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G_CODES = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R_CODES = L_CODES.map((code) => code.replace(/./g, (bit) => (bit === "0" ? "1" : "0")));
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function ean13(first12: string): string {
  const sum = [...first12].reduce((acc, digit, i) => acc + Number(digit) * (i % 2 ? 3 : 1), 0);
  return first12 + ((10 - (sum % 10)) % 10);
}

/** The 95 modules of an EAN-13 ("1" = bar). */
function eanModules(code: string): string {
  const digits = [...code].map(Number);
  const parity = PARITY[digits[0]];
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === "L" ? L_CODES : G_CODES)[digits[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R_CODES[digits[i]];
  return bits + "101";
}

function Barcode({ code, className }: { code: string; className?: string }) {
  const bits = eanModules(code);
  const bars: { x: number; width: number; guard: boolean }[] = [];
  for (let i = 0; i < bits.length; ) {
    if (bits[i] === "0") {
      i++;
      continue;
    }
    let end = i;
    while (bits[end] === "1") end++;
    bars.push({ x: i, width: end - i, guard: i < 3 || (i >= 45 && i < 50) || i >= 92 });
    i = end;
  }
  return (
    <svg
      viewBox="0 0 95 46"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.width} height={bar.guard ? 46 : 41} />
      ))}
    </svg>
  );
}

// ── The counter: a scanner reading labels that slide in ──

/** The rig is drawn at a fixed size (px) and scaled as a whole, so the laser always lands. */
const RIG = { width: 420, height: 320 };
/** Where the scanner's window sits, and the line the laser draws across the barcode. */
const NOSE = { x: 286, y: 122 };
const BEAM = { y: 250, from: 90, to: 310 };
const BEAM_CENTER = (BEAM.from + BEAM.to) / 2;

function ProductLabel({ productKey, visible }: { productKey: ProductKey; visible: boolean }) {
  const product = PRODUCTS[productKey];
  const code = ean13(product.code);
  return (
    <div
      data-card={productKey}
      className={cn("absolute top-[170px] w-[220px]", !visible && "invisible opacity-0")}
      style={{ left: BEAM_CENTER - 110 }}
    >
      <div className="bg-chalk text-ink relative rounded-2xl p-3.5 shadow-[0_28px_40px_-22px_rgb(0_0_0/0.95)]">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              product.tint,
            )}
          >
            {product.icon}
          </span>
          <div className="min-w-0 leading-none">
            <p className="font-display truncate text-[17px] font-extrabold uppercase">
              {product.name}
            </p>
            <p className="text-ink/55 mt-1 font-mono text-[11px] font-semibold tabular-nums">
              {product.size} · {formatPrice(product.priceCents)}
            </p>
          </div>
        </div>
        <Barcode code={code} className="mt-3 h-11 w-full" />
        <p className="mt-1 text-center font-mono text-[10px] leading-none tracking-[0.2em]">
          {`${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`}
        </p>
        <span
          data-card-flash
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-white opacity-0"
        />
      </div>
      {/* Its shadow on the counter. */}
      <span
        aria-hidden
        className="absolute inset-x-6 -bottom-3 -z-10 h-4 rounded-[50%] bg-black/60 blur-md"
      />
    </div>
  );
}

/**
 * A pistol-grip scanner drawn pointing left with its window at (0, 0); the rig rotates it
 * toward the barcode.
 */
function ScannerBody() {
  return (
    <g>
      <path
        d="M130 101 C 136 140, 178 150, 250 166"
        fill="none"
        stroke="oklch(0.3 0.035 262)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Grip */}
      <path
        d="M88 14 L128 17 L150 91 Q152 101 142 102 L117 103 Q107 103 105 94 Z"
        fill="url(#scanner-grip)"
        stroke="oklch(1 0 0 / 0.22)"
      />
      <path d="M120 38 L136 88 M111 42 L126 90" stroke="oklch(1 0 0 / 0.08)" strokeWidth="3" strokeLinecap="round" />
      {/* Trigger */}
      <path d="M76 16 Q70 36 85 46 L91 38 Q83 31 86 17 Z" fill="oklch(0.32 0.035 262)" stroke="oklch(1 0 0 / 0.15)" />
      {/* Head: an optic-yellow shell with a dark bumper around the window. */}
      <path
        d="M7 -31 L118 -22 Q141 -20 141 -4 L141 6 Q141 19 124 19 L7 31 Q0 31 0 24 L0 -24 Q0 -31 7 -31 Z"
        fill="url(#scanner-body)"
        stroke="oklch(0 0 0 / 0.3)"
      />
      <path d="M7 -31 L26 -29.5 L26 29.5 L7 31 Q0 31 0 24 L0 -24 Q0 -31 7 -31 Z" fill="oklch(0.24 0.03 262)" />
      <path d="M32 -26.5 L114 -19.5" stroke="oklch(1 0 0 / 0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 25 L120 16.5" stroke="oklch(0 0 0 / 0.22)" strokeWidth="3" strokeLinecap="round" />
      {/* Window */}
      <rect x="-3" y="-23" width="6" height="46" rx="2.5" fill="var(--color-marker)" />
      <rect x="-3" y="-23" width="6" height="46" rx="2.5" fill="var(--color-marker)" filter="url(#scanner-blur)" />
      {/* Read LED: green when the code is read. */}
      <circle cx="70" cy="-6" r="4.5" fill="oklch(0.25 0.03 262)" />
      <circle data-led cx="70" cy="-6" r="3" fill="var(--color-turf)" opacity="0" />
      <circle data-led cx="70" cy="-6" r="7" fill="var(--color-turf)" opacity="0" filter="url(#scanner-blur)" />
    </g>
  );
}

/** Drawn on its last frame (the full sale's last label under the laser); the loop takes it from there. */
function ScannerRig() {
  const angle = (Math.atan2(BEAM.y - NOSE.y, BEAM_CENTER - NOSE.x) * 180) / Math.PI - 180;
  return (
    <div
      aria-hidden
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.78] sm:scale-100"
      style={{ width: RIG.width, height: RIG.height }}
    >
      {/* Red light on the counter while the laser is on. */}
      <div
        data-laser-glow
        className="absolute top-[130px] h-[240px] w-[320px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-marker)_32%,transparent),transparent)]"
        style={{ left: BEAM_CENTER - 160 }}
      />
      {/* The counter's edge. */}
      <div className="absolute top-[306px] -right-16 -left-16 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--color-chalk)_30%,transparent),transparent)]" />

      {(Object.keys(PRODUCTS) as ProductKey[]).map((key) => (
        <ProductLabel key={key} productKey={key} visible={key === "pelotas"} />
      ))}

      <svg
        viewBox={`0 0 ${RIG.width} ${RIG.height}`}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <defs>
          <linearGradient id="scanner-body" x1="0" y1="-31" x2="0" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="oklch(0.95 0.17 118)" />
            <stop offset="0.55" stopColor="var(--color-ball)" />
            <stop offset="1" stopColor="oklch(0.74 0.16 112)" />
          </linearGradient>
          <linearGradient id="scanner-grip" x1="0" y1="16" x2="0" y2="103" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="oklch(0.36 0.04 262)" />
            <stop offset="1" stopColor="oklch(0.24 0.035 262)" />
          </linearGradient>
          <linearGradient
            id="scanner-fan"
            x1={NOSE.x}
            y1={NOSE.y}
            x2={NOSE.x}
            y2={BEAM.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--color-marker)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--color-marker)" stopOpacity="0.08" />
          </linearGradient>
          <filter id="scanner-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <g data-laser>
          <polygon
            points={`${NOSE.x},${NOSE.y} ${BEAM.from},${BEAM.y} ${BEAM.to},${BEAM.y}`}
            fill="url(#scanner-fan)"
            style={{ mixBlendMode: "screen" }}
          />
          <g data-laser-line>
            <line
              x1={BEAM.from}
              x2={BEAM.to}
              y1={BEAM.y}
              y2={BEAM.y}
              stroke="var(--color-marker)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.7"
              filter="url(#scanner-blur)"
            />
            <line
              x1={BEAM.from}
              x2={BEAM.to}
              y1={BEAM.y}
              y2={BEAM.y}
              stroke="oklch(0.78 0.16 28)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </g>
        </g>

        <g transform={`translate(${NOSE.x} ${NOSE.y}) rotate(${angle}) scale(0.95)`}>
          <ScannerBody />
        </g>
      </svg>

      {/* The read: a ring out of the barcode and the beep. */}
      <span
        data-bip-ring
        className="border-ball absolute size-20 rounded-full border-2 opacity-0"
        style={{ left: BEAM_CENTER - 40, top: BEAM.y - 40 }}
      />
      <span
        data-bip
        className="font-display text-ball absolute top-[118px] left-[16px] text-6xl leading-none font-black opacity-0 [text-shadow:0_6px_24px_rgb(0_0_0/0.6)]"
      >
        BIP
      </span>
    </div>
  );
}

// ── The panel: what the scan does on screen ──

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded border border-current/25 px-1 font-mono text-[10px] leading-4 font-semibold opacity-70 sm:inline">
      {children}
    </kbd>
  );
}

function ScanBox({ scene, accent }: { scene: SceneKey; accent: "turf" | "ball" }) {
  return (
    <div
      data-scanbox={scene}
      className="bg-ink ring-chalk/15 relative flex h-11 items-center gap-2.5 rounded-xl px-3 ring-1"
    >
      <ScanBarcode className="text-fog size-4.5 shrink-0" />
      <span className="relative min-w-0 flex-1 text-sm">
        <span data-scan-placeholder className="text-fog block truncate">
          Escaneá un producto o escribí su nombre
        </span>
        <span
          data-scan-typed
          className="text-chalk absolute inset-0 truncate font-mono tracking-wider opacity-0"
        />
      </span>
      <span
        data-scan-ring
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-2",
          accent === "turf" ? "ring-turf" : "ring-ball",
        )}
      />
    </div>
  );
}

function TicketLines({
  scene,
  title,
  accent,
}: {
  scene: SceneKey;
  title: string;
  accent: "turf" | "ball";
}) {
  return (
    <div>
      <p className="text-chalk mb-1.5 text-sm font-semibold">{title}</p>
      <ul className="flex flex-col gap-1">
        {ticketLines(SCANS[scene]).map(({ key, count }) => {
          const product = PRODUCTS[key];
          return (
            <li
              key={key}
              data-line={`${scene}-${key}`}
              className="relative flex h-10 items-center gap-3 rounded-xl px-2.5"
            >
              <span
                data-line-hi
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0",
                  accent === "turf" ? "bg-turf/15" : "bg-ball/15",
                )}
              />
              <span
                data-qty
                className="bg-chalk/10 relative min-w-8 rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-semibold tabular-nums"
              >
                {count}×
              </span>
              <span className="relative min-w-0 flex-1 truncate text-sm">
                {product.name} <span className="text-fog">{product.size}</span>
              </span>
              <span data-amount className="relative font-mono text-sm tabular-nums">
                {formatPrice(product.priceCents * count)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const METHODS = [
  { key: "cash", label: "Efectivo", short: "Efectivo", icon: Banknote, shortcut: "F1" },
  { key: "qr", label: "QR", short: "QR", icon: QrCode, shortcut: "F2" },
  { key: "transfer", label: "Transferencia", short: "Transf.", icon: Landmark, shortcut: "F3" },
];

function SaleScene() {
  return (
    <div data-scene="mostrador" className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-turf/15 text-turf ring-turf/40 rounded-full px-3 py-1 font-semibold ring-1">
          Cobrar
        </span>
        <span className="text-fog rounded-full px-3 py-1">Cargar stock</span>
      </div>
      <ScanBox scene="mostrador" accent="turf" />
      <TicketLines scene="mostrador" title="Venta" accent="turf" />
      <div className="border-chalk/10 flex items-end justify-between border-t pt-3">
        <span className="text-fog text-sm">Total</span>
        <span
          data-total="mostrador"
          className="font-display text-4xl leading-none font-extrabold tabular-nums"
        >
          {formatPrice(SALE_TOTAL)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map(({ key, label, short, icon: Icon, shortcut }) => (
          <span
            key={key}
            data-method={key}
            data-on={key === "cash"}
            className="border-chalk/15 text-chalk/80 data-[on=true]:border-turf data-[on=true]:bg-turf data-[on=true]:text-ink flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold"
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
            <Key>{shortcut}</Key>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p data-change className="text-fog text-xs leading-snug">
          Paga con <span className="text-chalk font-semibold">{formatPrice(PAID_WITH_CENTS)}</span>
          <br />
          Vuelto{" "}
          <span className="font-display text-turf text-lg font-extrabold tabular-nums">
            {formatPrice(PAID_WITH_CENTS - SALE_TOTAL)}
          </span>
        </p>
        <span
          data-charge
          className="bg-turf text-ink inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Cobrar <Key>F4</Key>
        </span>
      </div>
    </div>
  );
}

function BillScene() {
  return (
    <div data-scene="cuenta" className="invisible flex flex-col gap-3 opacity-0">
      <div>
        <p className="font-display text-2xl leading-none font-extrabold uppercase">
          Cuenta del turno
        </p>
        <p className="text-fog mt-1 text-xs">Cancha 2 · 21:30 · Juli P.</p>
      </div>
      <ScanBox scene="cuenta" accent="ball" />
      <TicketLines scene="cuenta" title="Consumos" accent="ball" />
      <div className="border-chalk/10 flex items-end justify-between border-t pt-3">
        <span className="text-fog text-sm">Consumos</span>
        <span
          data-total="cuenta"
          className="font-display text-4xl leading-none font-extrabold tabular-nums"
        >
          {formatPrice(BILL_TOTAL)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-fog text-xs leading-snug">Se cobra junto con la cancha.</p>
        <span
          data-save
          className="bg-ball text-ink inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Guardar y cerrar
        </span>
      </div>
    </div>
  );
}

function Toast({ scene, title, detail }: { scene: SceneKey; title: string; detail: string }) {
  return (
    <div
      data-toast={scene}
      className="bg-chalk text-ink invisible absolute right-4 bottom-4 left-4 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 opacity-0 shadow-[0_20px_40px_-16px_rgb(0_0_0/0.8)] sm:left-auto"
    >
      <span className="bg-turf/20 flex size-7 shrink-0 items-center justify-center rounded-full text-[oklch(0.45_0.13_150)]">
        <Check className="size-4" strokeWidth={3} />
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-semibold">{title}</span>
        <span className="text-ink/60 text-[11px]">{detail}</span>
      </span>
    </div>
  );
}

const POINTS = [
  {
    title: "Lo conectás y listo",
    text: "Sirve cualquier lector USB o inalámbrico. No hay nada que instalar: escaneás desde el panel, en la compu del mostrador.",
  },
  {
    title: "Mostrador o cancha",
    text: "Cobrás en efectivo, QR o transferencia con el vuelto hecho, o lo cargás a la cuenta del turno y se cobra con la cancha.",
  },
  {
    title: "Un sonido para cada cosa",
    text: "Un bip cuando se suma y otro si el código es nuevo: lo asociás o creás el producto ahí mismo, sin frenar la fila.",
  },
];

/**
 * The kiosk's barcode scanner, shown working: a scanner reads labels on the counter and the
 * panel answers each read — first a sale charged in cash, then drinks loaded to a turno's
 * bill — on a loop that only runs while the stage is on screen. Without JS or with reduced
 * motion, the stage renders its last frame (the full sale) and stays still. The sound cues
 * are the panel's own (`pos-sound`), off until the visitor turns them on.
 */
export function ScannerShowcase() {
  const scope = useRef<HTMLElement>(null);
  const soundRef = useRef(false);
  const [soundOn, setSoundOn] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  function toggleSound() {
    const next = !soundOn;
    soundRef.current = next;
    setSoundOn(next);
    // The click is the gesture the browser needs before it lets the loop play anything.
    if (next) playPosCue("added");
  }

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const one = <T extends Element = HTMLElement>(selector: string, parent: Element = root) =>
        parent.querySelector<T>(selector)!;
      const all = (selector: string) => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cue = (name: PosCue) => {
          if (soundRef.current) playPosCue(name);
        };
        const laser = one<SVGGElement>("[data-laser]");
        const beam = one<SVGGElement>("[data-laser-line]");
        const beamLines = all("[data-laser-line] line");
        const glow = one("[data-laser-glow]");
        const led = all("[data-led]");
        const ring = one("[data-bip-ring]");
        const bip = one("[data-bip]");
        const cards = all("[data-card]");
        const scenes = { mostrador: one('[data-scene="mostrador"]'), cuenta: one('[data-scene="cuenta"]') };
        const chrome = { mostrador: one('[data-chrome="mostrador"]'), cuenta: one('[data-chrome="cuenta"]') };
        const toasts = { mostrador: one('[data-toast="mostrador"]'), cuenta: one('[data-toast="cuenta"]') };
        const totals = { mostrador: one('[data-total="mostrador"]'), cuenta: one('[data-total="cuenta"]') };
        const running = { mostrador: { cents: 0 }, cuenta: { cents: 0 } };
        const cash = one('[data-method="cash"]');
        const change = one("[data-change]");
        const charge = one("[data-charge]");
        const save = one("[data-save]");

        const lineParts = (scene: SceneKey, key: ProductKey) => {
          const line = one(`[data-line="${scene}-${key}"]`);
          return {
            line,
            qty: one("[data-qty]", line),
            amount: one("[data-amount]", line),
            highlight: one("[data-line-hi]", line),
          };
        };
        const writeTotal = (scene: SceneKey) => () => {
          totals[scene].textContent = formatPrice(Math.round(running[scene].cents / 100) * 100);
        };

        /** Text the loop rewrites: back to an empty ticket (start) or the full one (static). */
        const writeTickets = (state: "start" | "static") => {
          (Object.keys(SCANS) as SceneKey[]).forEach((scene) => {
            ticketLines(SCANS[scene]).forEach(({ key, count }) => {
              const { qty, amount } = lineParts(scene, key);
              const shown = state === "start" ? 1 : count;
              qty.textContent = `${shown}×`;
              amount.textContent = formatPrice(PRODUCTS[key].priceCents * shown);
            });
            running[scene].cents = 0;
            totals[scene].textContent = formatPrice(
              state === "start" ? 0 : scene === "mostrador" ? SALE_TOTAL : BILL_TOTAL,
            );
          });
          cash.dataset.on = String(state === "static");
        };

        const reset = () => {
          writeTickets("start");
          gsap.set(cards, { autoAlpha: 0, x: -460 });
          gsap.set([laser, glow, ring, bip, change, toasts.mostrador, toasts.cuenta], { autoAlpha: 0 });
          gsap.set(all("[data-line]"), { autoAlpha: 0 });
          gsap.set(all("[data-scan-typed]"), { autoAlpha: 0 });
          gsap.set(all("[data-scan-placeholder]"), { autoAlpha: 1 });
          gsap.set([scenes.mostrador, chrome.mostrador], { autoAlpha: 1, y: 0 });
          gsap.set([scenes.cuenta, chrome.cuenta], { autoAlpha: 0 });
        };
        reset();

        const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power3.out" } });
        let step = 0;

        const scan = (scene: SceneKey, key: ProductKey, count: number, totalCents: number) => {
          const at = `read${step++}`;
          const card = one(`[data-card="${key}"]`);
          const flash = one("[data-card-flash]", card);
          const box = one(`[data-scanbox="${scene}"]`);
          const typed = one("[data-scan-typed]", box);
          const placeholder = one("[data-scan-placeholder]", box);
          const boxRing = one("[data-scan-ring]", box);
          const { line, qty, amount, highlight } = lineParts(scene, key);
          const code = ean13(PRODUCTS[key].code);
          const typing = { chars: 0 };

          // The label slides along the counter and the laser comes on.
          tl.set(card, { x: -460, y: 0, rotate: -10, scale: 1, autoAlpha: 1 })
            .to(card, { x: 0, rotate: 0, duration: 0.6 })
            .set(laser, { autoAlpha: 1 }, "-=0.16")
            .fromTo(
              beamLines,
              { attr: { x1: BEAM_CENTER - 30, x2: BEAM_CENTER + 30 } },
              { attr: { x1: BEAM.from, x2: BEAM.to }, duration: 0.14, ease: "power2.out", immediateRender: false },
              "<",
            )
            .fromTo(glow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, immediateRender: false }, "<")
            .to(beam, { opacity: 0.45, duration: 0.05, repeat: 3, yoyo: true, ease: "none" })
            .addLabel(at)
            // The scanner reads it.
            .fromTo(led, { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power2.in", immediateRender: false }, at)
            .fromTo(flash, { autoAlpha: 0.85 }, { autoAlpha: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, at)
            .fromTo(ring, { autoAlpha: 1, scale: 0.4 }, { autoAlpha: 0, scale: 2.6, duration: 0.7, ease: "power2.out", immediateRender: false }, at)
            .fromTo(bip, { autoAlpha: 0, scale: 0.5, rotate: -6, y: 0 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.3, ease: "back.out(3)", immediateRender: false }, at)
            .to(bip, { autoAlpha: 0, y: -14, duration: 0.3, ease: "power2.in" }, `${at}+=0.45`)
            .to([laser, glow], { autoAlpha: 0, duration: 0.12 }, `${at}+=0.1`)
            // The panel gets the code, like a keyboard typing it, and adds the product.
            .set(placeholder, { autoAlpha: 0 }, at)
            .set(typed, { autoAlpha: 1 }, at)
            .fromTo(
              typing,
              { chars: 0 },
              {
                chars: code.length,
                duration: 0.2,
                ease: "none",
                immediateRender: false,
                onUpdate: () => {
                  typed.textContent = code.slice(0, Math.round(typing.chars));
                },
              },
              at,
            )
            .fromTo(boxRing, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.7, immediateRender: false }, `${at}+=0.22`)
            .set(typed, { autoAlpha: 0 }, `${at}+=0.3`)
            .set(placeholder, { autoAlpha: 1 }, `${at}+=0.3`)
            .call(() => cue("added"), [], `${at}+=0.22`);

          if (count === 1) {
            tl.fromTo(line, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, `${at}+=0.24`);
          } else {
            tl.call(
              () => {
                qty.textContent = `${count}×`;
                amount.textContent = formatPrice(PRODUCTS[key].priceCents * count);
              },
              [],
              `${at}+=0.24`,
            ).fromTo(qty, { scale: 1.5 }, { scale: 1, duration: 0.45, ease: "back.out(3)", immediateRender: false }, `${at}+=0.24`);
          }

          tl.fromTo(highlight, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.8, ease: "power1.in", immediateRender: false }, `${at}+=0.24`)
            .to(running[scene], { cents: totalCents, duration: 0.5, ease: "power2.out", onUpdate: writeTotal(scene) }, `${at}+=0.24`)
            // Off the counter, toward the screen.
            .to(card, { x: 330, y: -24, scale: 0.6, rotate: 8, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, `${at}+=0.32`);
        };

        const scanAll = (scene: SceneKey) => {
          const counts = new Map<ProductKey, number>();
          let total = 0;
          SCANS[scene].forEach((key) => {
            counts.set(key, (counts.get(key) ?? 0) + 1);
            total += PRODUCTS[key].priceCents;
            scan(scene, key, counts.get(key)!, total);
          });
        };

        const press = (target: Element, at: string) =>
          tl.fromTo(target, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)", immediateRender: false }, at);

        // 1 · A sale at the counter, charged in cash.
        scanAll("mostrador");
        tl.addLabel("pay", "+=0.3").call(() => {
          cash.dataset.on = "true";
        }, [], "pay");
        press(cash, "pay");
        tl.fromTo(change, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, "pay+=0.3");
        press(charge, "pay+=1.2");
        tl.call(() => cue("done"), [], "pay+=1.2")
          .fromTo(toasts.mostrador, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, "pay+=1.25")
          // The ticket empties for the next customer.
          .to(all("[data-line^='mostrador-']"), { autoAlpha: 0, duration: 0.3, stagger: 0.06 }, "pay+=1.7")
          .to(change, { autoAlpha: 0, duration: 0.3 }, "pay+=1.7")
          .call(() => {
            cash.dataset.on = "false";
          }, [], "pay+=1.7")
          .to(running.mostrador, { cents: 0, duration: 0.4, onUpdate: writeTotal("mostrador") }, "pay+=1.7")
          .to(toasts.mostrador, { autoAlpha: 0, y: 8, duration: 0.3, ease: "power2.in" }, "pay+=3")
          // 2 · Drinks after the match, loaded to the turno's bill.
          .to([scenes.mostrador, chrome.mostrador], { autoAlpha: 0, y: -8, duration: 0.35 }, "pay+=3.1")
          .fromTo([scenes.cuenta, chrome.cuenta], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false });
        scanAll("cuenta");
        tl.addLabel("save", "+=0.4");
        press(save, "save");
        tl.call(() => cue("done"), [], "save")
          .fromTo(toasts.cuenta, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, "save+=0.05")
          .to(toasts.cuenta, { autoAlpha: 0, y: 8, duration: 0.3, ease: "power2.in" }, "save+=1.9")
          .to([scenes.cuenta, chrome.cuenta], { autoAlpha: 0, y: -8, duration: 0.35 }, "save+=2")
          .to([scenes.mostrador, chrome.mostrador], { autoAlpha: 1, y: 0, duration: 0.4 })
          .call(reset);

        const trigger = ScrollTrigger.create({
          trigger: one("[data-stage]"),
          start: "top 85%",
          end: "bottom 10%",
          onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
        });

        return () => {
          trigger.kill();
          tl.kill();
          writeTickets("static");
        };
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      id="lector"
      className="bg-ink text-chalk relative isolate scroll-mt-20 overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="absolute top-1/2 left-1/4 -z-10 h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-marker)_14%,transparent),transparent)]"
      />

      <Container className="flex flex-col gap-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow className="text-ball">Kiosco con lector</Eyebrow>
              <span className="bg-ball text-ink rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase">
                Nuevo
              </span>
            </div>
            <DisplayTitle>Bip. Y ya está en la cuenta.</DisplayTitle>
          </div>
          <p className="text-fog max-w-md text-lg text-pretty">
            Conectá un lector de código de barras y el kiosco del panel se vuelve
            una caja: cada producto que pasás se suma solo al ticket o a la cuenta
            del turno.
          </p>
        </div>

        <div
          data-stage
          className="bg-ink-raised ring-chalk/10 relative grid overflow-hidden rounded-3xl shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] ring-1 lg:grid-cols-[1.05fr_1fr]"
        >
          <div className="bg-night-dots border-chalk/10 relative h-[16.5rem] overflow-hidden border-b sm:h-[22rem] lg:h-auto lg:min-h-[30rem] lg:border-r lg:border-b-0">
            <ScannerRig />
            {!reducedMotion && (
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? "Silenciar los sonidos del escaneo" : "Escuchar cómo suena cada escaneo"}
                className="border-chalk/20 text-fog hover:border-chalk/50 hover:text-chalk focus-visible:ring-ball/50 bg-ink/60 absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide uppercase backdrop-blur-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
              >
                {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {soundOn ? "Silenciar" : "Escuchalo"}
              </button>
            )}
          </div>

          <div aria-hidden className="relative flex flex-col">
            <div className="border-chalk/10 flex items-center gap-1.5 border-b px-5 py-3.5">
              <span className="bg-chalk/15 size-2.5 rounded-full" />
              <span className="bg-chalk/15 size-2.5 rounded-full" />
              <span className="bg-chalk/15 size-2.5 rounded-full" />
              <span className="text-fog relative ml-3 font-mono text-xs whitespace-nowrap">
                <span data-chrome="mostrador" className="block">
                  gtp · Kiosco · Mostrador
                </span>
                <span data-chrome="cuenta" className="invisible absolute inset-0 opacity-0">
                  gtp · Agenda · Cuenta del turno
                </span>
              </span>
            </div>
            <div className="grid flex-1 p-4 sm:p-5 [&>*]:col-start-1 [&>*]:row-start-1">
              <SaleScene />
              <BillScene />
            </div>
            <Toast
              scene="mostrador"
              title={`Venta cobrada · ${formatPrice(SALE_TOTAL)}`}
              detail={`Efectivo · vuelto ${formatPrice(PAID_WITH_CENTS - SALE_TOTAL)}`}
            />
            <Toast
              scene="cuenta"
              title="Cargado a la cuenta del turno"
              detail={`Cancha 2 · 21:30 · ${formatPrice(BILL_TOTAL)}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
            {POINTS.map((point, i) => (
              <div key={point.title} className="reveal border-chalk/15 flex flex-col gap-2 border-t pt-5">
                <span className="text-ball font-mono text-xs">0{i + 1}</span>
                <h3 className="font-display text-2xl leading-none font-extrabold uppercase">
                  {point.title}
                </h3>
                <p className="text-fog text-sm text-pretty">{point.text}</p>
              </div>
            ))}
          </div>
          <p className="text-fog/80 reveal font-mono text-xs tracking-wide">
            Con Bandeja y Smash, la mercadería que entra también se carga escaneándola y
            cada venta descuenta el stock.
          </p>
        </div>
      </Container>
    </section>
  );
}
