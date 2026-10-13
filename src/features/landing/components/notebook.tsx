"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, DisplayTitle, Eyebrow } from "./landing-ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface NotebookLine {
  text: string;
  note?: string;
  /** Circled in red — the double booking. */
  alarm?: boolean;
}

const NOTEBOOK_LINES: NotebookLine[] = [
  { text: "19:00 C1 — Lucho", note: "¿pagó?" },
  { text: "20:30 C2 — Fede + 3" },
  { text: "20:30 C2 — Marti", note: "PISADO!!", alarm: true },
  { text: "22:00 C1 — Juan", note: "transfiere mañana" },
  { text: "fijo jue: llamar a Diego" },
  { text: "pasar señas al excel" },
];

const SWAPS = [
  {
    before: "Contestar «¿tenés cancha?» a cualquier hora",
    after: "El bot responde en segundos, 24/7, con la disponibilidad real.",
  },
  {
    before: "Pedir la seña y perseguir el comprobante",
    after: "Pide la seña, la recibe por MercadoPago y confirma solo.",
  },
  {
    before: "Cruzar transferencias con reservas en el home banking",
    after: "Cada pago queda pegado a su turno. Sin planillas.",
  },
  {
    before: "Dos jugadores en el mismo turno",
    after: "Un turno, una reserva. Imposible que se pisen.",
  },
  {
    before: "Anotar los fijos de cada semana",
    after: "Los turnos fijos se generan solos, semana a semana.",
  },
];

/** A strike-through drawn like a marker; GSAP sweeps it in on scroll. */
function Strike({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "strike bg-marker/80 absolute top-1/2 -left-1 -right-2 h-[3px] origin-left -rotate-[1.5deg] rounded-full",
        className,
      )}
    />
  );
}

function NotebookPage() {
  return (
    <div className="relative mx-auto w-full max-w-md -rotate-2 lg:mx-0 lg:scale-[1.18] lg:origin-left">
      {/* Sticky note */}
      <div className="bg-ball text-ink font-hand absolute -top-6 -right-2 z-10 w-36 rotate-6 p-3 text-xl leading-tight font-bold shadow-[0_14px_30px_-14px_rgb(0_0_0/0.45)] sm:-right-8">
        47 chats sin leer 😩
      </div>

      <div className="notebook-paper text-[oklch(0.3_0.08_262)] relative rounded-sm pt-5 pr-6 pb-8 pl-16 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45),0_2px_0_0_oklch(0.88_0.02_90)]">
        <p className="font-hand h-9 text-2xl leading-9 font-bold">
          Sábado 14 ✏️
        </p>
        <ul className="font-hand text-[1.3rem] leading-9 font-medium sm:text-[1.6rem]">
          {NOTEBOOK_LINES.map((line) => (
            <li key={line.text} className="flex h-9 items-center gap-3 whitespace-nowrap">
              <span className="relative">
                {line.text}
                <Strike />
              </span>
              {line.note && (
                <span
                  className={cn(
                    "text-marker text-lg whitespace-nowrap sm:text-xl",
                    line.alarm &&
                      "ring-marker/80 -rotate-3 rounded-[50%] px-2 ring-2",
                  )}
                >
                  {line.note}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Notebook() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".strike", {
          scaleX: 0,
          duration: 0.45,
          ease: "power2.inOut",
          stagger: 0.22,
          scrollTrigger: { trigger: ".notebook-paper", start: "top 70%", once: true },
        });
      });
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      id="cuaderno"
      className="bg-paper text-ink scroll-mt-20 overflow-hidden py-24 lg:py-32"
    >
      <Container className="flex flex-col gap-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <Eyebrow className="text-court">Antes y después</Eyebrow>
          <DisplayTitle>Cerrá el cuaderno.</DisplayTitle>
          <p className="text-ink/70 max-w-2xl text-lg text-pretty">
            Si tu club todavía funciona con un cuaderno, un grupo de WhatsApp y
            el home banking abierto, esto es para vos. Todo eso lo hace GTP.
          </p>
        </div>

        <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <NotebookPage />

          <ul className="divide-ink/10 border-ink/10 flex flex-col divide-y border-y">
            {SWAPS.map((swap) => (
              <li
                key={swap.before}
                className="reveal grid gap-1.5 py-5 sm:grid-cols-[1fr_1.15fr] sm:gap-6"
              >
                <p className="text-ink/60 decoration-marker/60 text-[15px] line-through decoration-2">
                  {swap.before}
                </p>
                <p className="flex gap-2.5 font-medium">
                  <span className="bg-court text-chalk mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {swap.after}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
