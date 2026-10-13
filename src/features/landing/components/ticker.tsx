import { PadelBall } from "./brand-wordmark";

const ITEMS = [
  "03:07 · Cancha 2 · Reservada por WhatsApp",
  "Seña $5.000 · Conciliada con MercadoPago",
  "22:30 · Cancha 1 · Confirmada",
  "Turnos pisados: 0",
  "Domingo 09:00 · Fijo semanal · Generado solo",
  "Consulta de torneo · Derivada al dueño",
  "Chats sin responder: 0",
];

function TickerGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center"
    >
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center gap-6 pr-6 font-mono text-sm font-semibold tracking-wide whitespace-nowrap uppercase"
        >
          {item}
          <PadelBall className="size-4 [&_circle]:fill-ink [&_path]:stroke-ball" />
        </span>
      ))}
    </div>
  );
}

/** Sports-ticker band: what the bot did last night, scrolling past. */
export function Ticker() {
  return (
    <section
      aria-label="Lo que hizo el bot anoche"
      className="bg-ball text-ink marquee-row relative -my-px overflow-hidden py-3.5"
    >
      <div className="animate-marquee flex w-max">
        <TickerGroup />
        <TickerGroup ariaHidden />
      </div>
    </section>
  );
}
