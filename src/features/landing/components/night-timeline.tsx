"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, DisplayTitle, Eyebrow } from "./landing-ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Moment {
  time: string;
  /** Sky label shown next to the sticky clock. */
  phase: string;
  title: string;
  text: string;
  visual: ReactNode;
}

function PlayerBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="bg-[oklch(0.5_0.13_155)] max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm text-white">
        {children}
        <CheckCheck className="ml-1.5 inline size-3.5 opacity-70" />
      </p>
    </div>
  );
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <p className="bg-chalk text-ink max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm">
        {children}
      </p>
    </div>
  );
}

function Chip({
  children,
  tone = "turf",
}: {
  children: ReactNode;
  tone?: "turf" | "ball";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase",
        tone === "turf" ? "bg-turf/15 text-turf" : "bg-ball/15 text-ball",
      )}
    >
      {children}
    </span>
  );
}

const MOMENTS: Moment[] = [
  {
    time: "20:41",
    phase: "Martes · atardecer",
    title: "Alguien pregunta si hay cancha",
    text: "El bot responde al instante con los horarios que de verdad están libres y el precio de esa franja. Habla como una persona, en criollo.",
    visual: (
      <>
        <PlayerBubble>Hola! tenés cancha para hoy a la noche? 🎾</PlayerBubble>
        <BotBubble>
          ¡Hola Marce! Tengo libre 21:00 en Cancha 2 (90 min, $24.000). ¿Te
          lo reservo?
        </BotBubble>
      </>
    ),
  },
  {
    time: "20:42",
    phase: "Martes · noche",
    title: "Reserva el turno y pide la seña",
    text: "Lo retiene a nombre del jugador y le pasa tu alias de MercadoPago. Nadie más puede tomar ese horario mientras llega el pago.",
    visual: (
      <>
        <PlayerBubble>Dale, joya 🙌</PlayerBubble>
        <BotBubble>
          Listo. Para confirmarlo transferí la seña de $5.000 al alias{" "}
          <strong>tu.club.mp</strong> y te aviso apenas llegue.
        </BotBubble>
        <Chip tone="ball">21:00 · Cancha 2 · Esperando seña</Chip>
      </>
    ),
  },
  {
    time: "20:45",
    phase: "Martes · noche",
    title: "Llega la plata y se confirma solo",
    text: "GTP cruza la transferencia con la reserva correcta y confirma el turno. Vos no abriste el home banking.",
    visual: (
      <div className="bg-ink/60 ring-chalk/10 flex flex-col gap-3 rounded-2xl p-4 ring-1 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-fog font-mono text-[11px] tracking-wide uppercase">
            MercadoPago
          </p>
          <p className="text-chalk text-sm font-semibold">
            Transferencia recibida · $5.000
          </p>
          <p className="text-fog text-xs">de Marcelo Bianchi</p>
        </div>
        <ArrowRight className="text-ball size-5 shrink-0 rotate-90 sm:rotate-0" />
        <div className="min-w-0 flex-1">
          <p className="text-fog font-mono text-[11px] tracking-wide uppercase">
            Tu agenda
          </p>
          <p className="text-chalk text-sm font-semibold">21:00 · Cancha 2</p>
          <Chip>
            <Check className="size-3" /> Confirmada
          </Chip>
        </div>
      </div>
    ),
  },
  {
    time: "22:10",
    phase: "Martes · noche",
    title: "Una consulta que necesita tu toque",
    text: "¿Un torneo, un reclamo, algo fuera de lo común? El bot te avisa, vos entrás al chat desde el panel y él se corre. Cuando terminás, se lo devolvés.",
    visual: (
      <>
        <PlayerBubble>
          Quiero armar un torneo de 16 parejas el mes que viene, ¿se puede?
        </PlayerBubble>
        <Chip tone="ball">Derivado al dueño · el bot espera</Chip>
      </>
    ),
  },
  {
    time: "23:58",
    phase: "Martes · medianoche",
    title: "Dos quieren el mismo turno. No se pisan.",
    text: "Las 21:00 de mañana ya están tomadas: el bot lo sabe y ofrece la mejor alternativa. Un turno, una reserva. Siempre.",
    visual: (
      <>
        <PlayerBubble>Mañana 21hs en la 2?</PlayerBubble>
        <BotBubble>
          Ese ya está reservado 😕 Te puedo ofrecer 21:00 en Cancha 3 o 22:30
          en la 2. ¿Cuál preferís?
        </BotBubble>
      </>
    ),
  },
  {
    time: "03:07",
    phase: "Miércoles · madrugada",
    title: "La reserva de las 3 de la mañana",
    text: "La que antes leías a las 9, cuando el jugador ya había reservado en otro club. Ahora se cierra en el momento.",
    visual: (
      <>
        <PlayerBubble>Hay algo para el sábado a las 10? Somos 4</PlayerBubble>
        <Chip>
          <Check className="size-3" /> Sáb 10:00 · Cancha 1 · Confirmada
        </Chip>
      </>
    ),
  },
  {
    time: "08:30",
    phase: "Miércoles · mañana",
    title: "Vos te despertás y abrís el panel",
    text: "Todo lo que pasó a la noche ya está ordenado: reservas nuevas, señas cobradas, chats atendidos. Sin un mensaje pendiente.",
    visual: (
      <div className="bg-chalk text-ink grid grid-cols-3 gap-px overflow-hidden rounded-2xl">
        {[
          { value: "7", label: "reservas nuevas" },
          { value: "$35k", label: "en señas cobradas" },
          { value: "0", label: "chats sin responder" },
        ].map((stat) => (
          <div key={stat.label} className="bg-chalk p-4">
            <p className="font-display text-4xl leading-none font-black">
              {stat.value}
            </p>
            <p className="text-ink/60 mt-1 text-xs leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>
    ),
  },
];

/**
 * "Una noche con GTP": the whole product told as one night at a club. On
 * desktop a sticky clock follows the reader and the sky shifts from dusk to
 * deep night to morning as they scroll. Without JS every moment still shows
 * its own time.
 */
export function NightTimeline() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const clock = scope.current?.querySelector<HTMLElement>("[data-clock]");
      const phase = scope.current?.querySelector<HTMLElement>("[data-phase]");
      const moments = gsap.utils.toArray<HTMLElement>("[data-moment]");

      moments.forEach((moment) => {
        ScrollTrigger.create({
          trigger: moment,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: ({ isActive }) => {
            moment.dataset.active = String(isActive);
            if (!isActive) return;
            if (clock) clock.textContent = moment.dataset.time ?? "";
            if (phase) phase.textContent = moment.dataset.phase ?? "";
          },
        });
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const sky = { trigger: scope.current, scrub: true };
        gsap.fromTo(
          "[data-sky='dusk']",
          { opacity: 1 },
          { opacity: 0, ease: "none", scrollTrigger: { ...sky, start: "top 40%", end: "30% center" } },
        );
        gsap.fromTo(
          "[data-sky='dawn']",
          { opacity: 0 },
          { opacity: 1, ease: "none", scrollTrigger: { ...sky, start: "75% center", end: "bottom bottom" } },
        );
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      id="como-funciona"
      className="bg-ink text-chalk relative isolate scroll-mt-20 overflow-clip"
    >
      {/* Sky: dusk fades out into night, then dawn fades in near the end. */}
      <div
        aria-hidden
        data-sky="dusk"
        className="absolute inset-x-0 top-0 -z-10 h-[60rem] bg-[linear-gradient(180deg,oklch(0.36_0.12_300/0.55),oklch(0.3_0.1_20/0.25)_35%,transparent_75%)]"
      />
      <div
        aria-hidden
        data-sky="dawn"
        className="absolute inset-x-0 bottom-0 -z-10 h-[46rem] bg-[linear-gradient(0deg,var(--color-paper),oklch(0.86_0.09_75)_9%,oklch(0.62_0.15_30/0.55)_30%,oklch(0.4_0.12_320/0.25)_55%,transparent_85%)] opacity-0"
      />
      <div aria-hidden className="bg-night-dots absolute inset-0 -z-10 opacity-40" />

      <Container className="py-24 lg:py-32">
        <div className="flex max-w-3xl flex-col gap-5">
          <Eyebrow className="text-ball">Cómo funciona</Eyebrow>
          <DisplayTitle>Una noche cualquiera, con GTP atendiendo</DisplayTitle>
          <p className="text-fog max-w-2xl text-lg text-pretty">
            Desde que alguien pregunta por una cancha hasta que vos abrís el
            panel a la mañana. Así trabaja el bot mientras no estás.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Sticky clock (desktop) */}
          <div aria-hidden className="hidden lg:block">
            <div className="sticky top-32">
              <p
                data-clock
                className="font-display text-chalk text-[11rem] leading-[0.8] font-black tabular-nums"
              >
                20:41
              </p>
              <p
                data-phase
                className="text-ball mt-4 font-mono text-sm tracking-[0.2em] uppercase"
              >
                Martes · atardecer
              </p>
            </div>
          </div>

          <ol className="flex flex-col gap-6">
            {MOMENTS.map((moment) => (
              <li
                key={moment.time}
                data-moment
                data-time={moment.time}
                data-phase={moment.phase}
                className="group border-chalk/10 bg-ink-raised/60 data-[active=true]:border-ball/40 data-[active=true]:bg-ink-raised flex flex-col gap-5 rounded-3xl border p-6 backdrop-blur-sm transition-colors duration-500 sm:p-8"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-ball font-mono text-sm font-semibold tracking-widest">
                    {moment.time}
                    <span className="text-fog font-normal lg:hidden">
                      {" "}
                      · {moment.phase}
                    </span>
                  </p>
                  <h3 className="font-display text-3xl leading-none font-extrabold uppercase sm:text-4xl">
                    {moment.title}
                  </h3>
                  <p className="text-fog text-pretty">{moment.text}</p>
                </div>
                <div className="flex flex-col items-start gap-2.5 [&>div]:w-full">
                  {moment.visual}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
