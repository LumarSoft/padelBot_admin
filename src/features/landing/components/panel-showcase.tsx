"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import { Container, DisplayTitle, Eyebrow, LandingButton } from "./landing-ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type CellKind = "confirmed" | "pending" | "fixed" | "free" | "blocked" | "live";

interface Cell {
  kind: CellKind;
  label?: string;
}

const TIMES = ["17:00", "18:30", "20:00", "21:30", "23:00"];
const COURTS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

/** AGENDA[court][slot] */
const AGENDA: Cell[][] = [
  [
    { kind: "confirmed", label: "Lucho R." },
    { kind: "free" },
    { kind: "fixed", label: "Los del martes" },
    { kind: "confirmed", label: "Juli P." },
    { kind: "free" },
  ],
  [
    { kind: "free" },
    { kind: "confirmed", label: "Sofi M." },
    { kind: "live", label: "Marce B." },
    { kind: "confirmed", label: "Fede L." },
    { kind: "blocked" },
  ],
  [
    { kind: "fixed", label: "Clase · Prof. Ana" },
    { kind: "pending", label: "Nico G." },
    { kind: "confirmed", label: "Tomi V." },
    { kind: "confirmed", label: "Caro D." },
    { kind: "free" },
  ],
  [
    { kind: "free" },
    { kind: "confirmed", label: "Gonza P." },
    { kind: "confirmed", label: "Mati S." },
    { kind: "pending", label: "Lu B." },
    { kind: "free" },
  ],
];

const STATS = [
  { label: "Reservas hoy", value: "18" },
  { label: "Señas cobradas", value: "$86.000" },
  { label: "Ocupación", value: "82%" },
  { label: "Chats del bot", value: "41" },
];

const CHATS = [
  { name: "Marce B.", text: "Listo, ya transferí 🙌", tag: "Bot" },
  { name: "Pablo R.", text: "Quiero armar un torneo de 16…", tag: "Te necesita" },
  { name: "Juli P.", text: "Gracias!! nos vemos 21:30", tag: "Bot" },
  { name: "Prof. Ana", text: "Mañana llego 10 min tarde", tag: "Vos" },
];

const PANEL_FEATURES = [
  {
    title: "Agenda en vivo",
    text: "Por cancha y por día. Lo que reserva el bot aparece solo, sin refrescar. Vos también podés reservar o bloquear.",
  },
  {
    title: "Pagos y señas",
    text: "Qué seña entró, cuál falta y de quién. La caja del día, ya cruzada con cada turno.",
  },
  {
    title: "Conversaciones",
    text: "Leé cada charla del bot en tiempo real y tomá el control de la que quieras con un clic.",
  },
  {
    title: "Jugadores y reportes",
    text: "El historial de cada jugador, quién faltó, y cuánto recaudaste en el mes.",
  },
];

const CELL_STYLE: Record<Exclude<CellKind, "live">, string> = {
  confirmed: "bg-court text-chalk",
  pending: "bg-ball/12 text-ball ring-1 ring-inset ring-ball/50",
  fixed:
    "bg-court-deep text-chalk/90 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(255_255_255/0.06)_6px_12px)]",
  free: "text-fog/40 border border-dashed border-chalk/15",
  blocked:
    "text-fog/50 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.04)_0_4px,transparent_4px_8px)]",
};

const CELL_CAPTION: Record<Exclude<CellKind, "live">, string> = {
  confirmed: "Confirmada",
  pending: "Espera seña",
  fixed: "Turno fijo",
  free: "Libre",
  blocked: "Bloqueada",
};

function AgendaCell({ cell }: { cell: Cell }) {
  if (cell.kind === "live") {
    return (
      <div className="relative h-full min-h-14">
        <CellBody kind="pending" label={cell.label} className="absolute inset-0" />
        <CellBody
          kind="confirmed"
          label={cell.label}
          className="live-confirmed ring-ball absolute inset-0 ring-2"
        />
      </div>
    );
  }
  return <CellBody kind={cell.kind} label={cell.label} className="h-full min-h-14" />;
}

function CellBody({
  kind,
  label,
  className,
}: {
  kind: Exclude<CellKind, "live">;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg px-2.5 py-2 text-xs",
        CELL_STYLE[kind],
        className,
      )}
    >
      {label && <span className="truncate font-semibold">{label}</span>}
      <span className="truncate text-[10px] opacity-75">{CELL_CAPTION[kind]}</span>
    </div>
  );
}

function PanelMock() {
  return (
    <div className="bg-ink-raised ring-chalk/10 relative overflow-hidden rounded-3xl shadow-[0_50px_100px_-40px_rgb(0_0_0/0.9)] ring-1">
      <div className="border-chalk/10 flex items-center gap-1.5 border-b px-5 py-3.5">
        <span className="bg-chalk/15 size-2.5 rounded-full" />
        <span className="bg-chalk/15 size-2.5 rounded-full" />
        <span className="bg-chalk/15 size-2.5 rounded-full" />
        <span className="text-fog ml-3 font-mono text-xs">
          gtp · Agenda · Sábado 14
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-ink rounded-xl px-3 py-2.5">
                <p className="text-fog text-[11px]">{stat.label}</p>
                <p className="font-display text-chalk text-2xl leading-tight font-extrabold tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[2.5rem_repeat(3,minmax(0,1fr))] gap-1.5 sm:grid-cols-[3rem_repeat(4,minmax(0,1fr))]">
            <span />
            {COURTS.map((court, i) => (
              <span
                key={court}
                className={cn(
                  "text-fog pb-1 text-[11px] font-medium",
                  i === 3 && "hidden sm:block",
                )}
              >
                {court}
              </span>
            ))}
            {TIMES.map((time, slot) => (
              <div key={time} className="contents">
                <span className="text-fog pt-2 font-mono text-[11px] tabular-nums">
                  {time}
                </span>
                {AGENDA.map((court, c) => (
                  <div key={c} className={cn(c === 3 && "hidden sm:block")}>
                    <AgendaCell cell={court[slot]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <aside className="border-chalk/10 hidden flex-col gap-2 border-l p-4 md:flex">
          <p className="text-chalk mb-1 text-sm font-semibold">Conversaciones</p>
          {CHATS.map((chat) => (
            <div key={chat.name} className="bg-ink flex flex-col gap-1 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-chalk text-xs font-semibold">{chat.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    chat.tag === "Bot" && "bg-court/40 text-chalk",
                    chat.tag === "Vos" && "bg-chalk/10 text-chalk",
                    chat.tag === "Te necesita" && "bg-ball text-ink",
                  )}
                >
                  {chat.tag}
                </span>
              </div>
              <p className="text-fog truncate text-xs">{chat.text}</p>
            </div>
          ))}
        </aside>
      </div>

      {/* Real-time toast */}
      <div className="live-toast bg-chalk text-ink absolute right-4 bottom-4 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-[0_20px_40px_-16px_rgb(0_0_0/0.8)] md:right-[18.5rem]">
        <span className="bg-turf/20 flex size-7 items-center justify-center rounded-full text-[oklch(0.45_0.13_150)]">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-semibold">Seña recibida · Marce B.</span>
          <span className="text-ink/60 flex items-center gap-1 text-[11px]">
            <WhatsAppIcon className="size-3" /> 20:00 · Cancha 2 · confirmada sola
          </span>
        </span>
      </div>
    </div>
  );
}

export function PanelShowcase() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".live-confirmed", { opacity: 0 });
        gsap.set(".live-toast", { opacity: 0, y: 16 });
        gsap
          .timeline({
            scrollTrigger: { trigger: ".live-confirmed", start: "top 70%", once: true },
            delay: 0.6,
          })
          .to(".live-confirmed", { opacity: 1, duration: 0.5, ease: "power2.out" })
          .to(".live-toast", { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, "<0.15");
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      id="panel"
      className="bg-ink text-chalk relative isolate scroll-mt-20 overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -z-10 h-[40rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-court)_40%,transparent),transparent)]"
      />

      <Container className="flex flex-col gap-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-5">
            <Eyebrow className="text-ball">El panel</Eyebrow>
            <DisplayTitle>Todo tu club, en una pantalla.</DisplayTitle>
          </div>
          <p className="text-fog max-w-md text-lg text-pretty">
            El bot atiende a los jugadores; el panel te da el control a vos.
            Pensado para que cualquier dueño lo entienda en minutos.
          </p>
        </div>

        <PanelMock />

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PANEL_FEATURES.map((feature, i) => (
            <div key={feature.title} className="reveal border-chalk/15 flex flex-col gap-2 border-t pt-5">
              <span className="text-ball font-mono text-xs">0{i + 1}</span>
              <h3 className="font-display text-2xl leading-none font-extrabold uppercase">
                {feature.title}
              </h3>
              <p className="text-fog text-sm text-pretty">{feature.text}</p>
            </div>
          ))}
        </div>

        <div>
          <LandingButton href="/login" variant="chalk">
            Ya tengo cuenta · Entrar al panel
          </LandingButton>
        </div>
      </Container>
    </section>
  );
}
