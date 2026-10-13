"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import {
  useBoardScript,
  type BoardEvent,
  type BoardRow,
  type BoardStatus,
} from "../hooks/use-board-script";
import { useFlapText } from "../hooks/use-flap-text";

const INITIAL_CLOCK = "03:04";

const INITIAL_ROWS: BoardRow[] = [
  { time: "18:00", court: "C1", player: "LUCHO R.", status: "CONFIRMADO" },
  { time: "19:30", court: "C3", player: "SOFI M.", status: "CONFIRMADO" },
  { time: "21:00", court: "C2", player: "", status: "LIBRE" },
  { time: "21:00", court: "C3", player: "NICO G.", status: "PEND. SEÑA" },
  { time: "22:30", court: "C1", player: "", status: "LIBRE" },
  { time: "22:30", court: "C2", player: "", status: "LIBRE" },
];

const SCRIPT: BoardEvent[] = [
  {
    clock: "03:07",
    from: "Marce",
    text: "Hola! hay cancha mañana a las 21? 🎾",
    row: 2,
    patch: { player: "MARCE B.", status: "PEND. SEÑA" },
  },
  {
    clock: "03:09",
    from: "Marce",
    text: "Listo, ya te transferí la seña",
    row: 2,
    patch: { status: "CONFIRMADO" },
  },
  {
    clock: "03:12",
    from: "Nico",
    text: "Ahí mandé el comprobante 👍",
    row: 3,
    patch: { status: "CONFIRMADO" },
  },
  {
    clock: "03:26",
    from: "Juli",
    text: "Tenés algo 22:30? Somos 4",
    row: 4,
    patch: { player: "JULI P.", status: "PEND. SEÑA" },
  },
  {
    clock: "03:27",
    from: "Juli",
    text: "Pagado ✅",
    row: 4,
    patch: { status: "CONFIRMADO" },
  },
];

const PLAYER_WIDTH = 8;
const STATUS_WIDTH = 10;

const COLUMNS = [
  { label: "HORA", chars: 5 },
  { label: "CAN.", chars: 2 },
  { label: "JUGADOR", chars: PLAYER_WIDTH },
  { label: "ESTADO", chars: STATUS_WIDTH },
];

/** Tiles are 1.15em wide with a 0.12em gap (see FlapText). */
function tilesWidthEm(chars: number): number {
  return chars * 1.15 + (chars - 1) * 0.12;
}

const STATUS_TONE: Record<BoardStatus, string> = {
  LIBRE: "text-fog/55",
  "PEND. SEÑA": "text-ball",
  CONFIRMADO: "text-turf",
};

const STATUS_BAR: Record<BoardStatus, string> = {
  LIBRE: "bg-chalk/10",
  "PEND. SEÑA": "bg-ball",
  CONFIRMADO: "bg-turf",
};

/** One row of split-flap tiles; `length` keeps every row on the same grid. */
function FlapText({
  value,
  length,
  className,
}: {
  value: string;
  length: number;
  className?: string;
}) {
  const shown = useFlapText(value.padEnd(length, " ").slice(0, length));

  return (
    <span className={cn("flex shrink-0 gap-[0.12em]", className)}>
      {[...shown].map((char, i) => (
        <span
          key={i}
          className="relative inline-flex h-[1.6em] w-[1.15em] items-center justify-center overflow-hidden rounded-[0.16em] bg-[oklch(0.11_0.02_262)] font-mono leading-none font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
        >
          {char}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
        </span>
      ))}
    </span>
  );
}

function BoardLine({ row }: { row: BoardRow }) {
  return (
    <div className="flap-tile flex items-center gap-[0.8em]">
      <span
        className={cn(
          "-mr-[0.4em] h-[1.6em] w-[0.22em] rounded-full transition-colors duration-500",
          STATUS_BAR[row.status],
        )}
      />
      <FlapText value={row.time} length={5} className="text-chalk" />
      <FlapText value={row.court} length={2} className="text-chalk" />
      <FlapText value={row.player} length={PLAYER_WIDTH} className="text-chalk/90" />
      <FlapText
        value={row.status}
        length={STATUS_WIDTH}
        className={STATUS_TONE[row.status]}
      />
    </div>
  );
}

/**
 * The hero's money shot: the club's turn board at 3 AM, filling itself while
 * WhatsApp messages come in. Purely illustrative — scripted, no real data.
 */
export function FlapBoard({ className }: { className?: string }) {
  const { rows, clock, message } = useBoardScript(
    INITIAL_ROWS,
    SCRIPT,
    INITIAL_CLOCK,
  );

  return (
    <figure
      className={cn("relative w-full max-w-[34rem]", className)}
      aria-label="Tablero de turnos de un club a las 3 de la mañana: llegan mensajes por WhatsApp y los turnos libres pasan a confirmados solos."
    >
      {/* Incoming WhatsApp message */}
      <div className="mb-3 flex h-[4.25rem] items-end justify-end" aria-hidden>
        {message && (
          <div
            key={message.id}
            className="animate-fade-up bg-chalk text-ink flex max-w-[85%] items-start gap-2.5 rounded-2xl rounded-br-md px-3.5 py-2.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)]"
          >
            <span className="bg-turf/20 text-[oklch(0.45_0.13_150)] mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
              <WhatsAppIcon className="size-4" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="text-ink/55 block text-[11px] font-medium">
                {message.from} · WhatsApp · {clock}
              </span>
              <span className="block text-sm font-medium">{message.text}</span>
            </span>
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="flap-board bg-ink-raised ring-chalk/10 rounded-2xl p-3 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 sm:p-4"
      >
        <div className="flap-tile mb-[0.9em] flex items-center justify-between">
          <span className="text-fog flex items-center gap-[0.5em] font-mono text-[0.75em] tracking-[0.2em]">
            <span className="bg-ball animate-live-dot size-[0.55em] rounded-full" />
            SÁBADO · TURNOS
          </span>
          <FlapText value={clock} length={5} className="text-ball" />
        </div>

        <div className="flap-tile mb-[0.45em] flex items-center gap-[0.8em]">
          <span className="-mr-[0.4em] w-[0.22em]" />
          {COLUMNS.map((column) => (
            <span
              key={column.label}
              style={{ width: `${tilesWidthEm(column.chars)}em` }}
              className="shrink-0"
            >
              <span className="text-fog/60 font-mono text-[0.58em] tracking-[0.16em]">
                {column.label}
              </span>
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-[0.45em]">
          {rows.map((row) => (
            <BoardLine key={row.time + row.court} row={row} />
          ))}
        </div>
      </div>

      <figcaption className="text-fog mt-3 flex items-center justify-between gap-3 font-mono text-[11px] tracking-wider uppercase">
        <span>El bot respondió cada mensaje en segundos</span>
        <span className="text-ball">Vos: durmiendo</span>
      </figcaption>
    </figure>
  );
}
