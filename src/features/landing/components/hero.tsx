import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { CourtLines } from "./court-lines";
import { FlapBoard } from "./flap-board";
import { Container, Eyebrow, LandingButton } from "./landing-ui";

const FACTS = [
  { value: "15 min", label: "para dejarlo andando" },
  { value: "Tu número", label: "el de siempre, no cambia" },
  { value: "14 días", label: "gratis y sin tarjeta" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-night-dots absolute inset-0 -z-10 opacity-60" />
      <CourtLines className="text-chalk/[0.045] absolute top-1/2 hidden sm:block left-1/2 -z-10 w-[150rem] max-w-none -translate-x-1/2 -translate-y-1/2" />
      <div
        aria-hidden
        className="absolute -top-40 right-[-10%] -z-10 size-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-court)_45%,transparent),transparent)]"
      />

      <Container className="grid gap-14 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pt-20 lg:pb-28">
        <div className="stagger-children flex flex-col items-start gap-7">
          <Eyebrow className="text-fog flex items-center gap-2">
            <span className="bg-ball animate-live-dot size-2 rounded-full" />
            Bot de WhatsApp + panel · para complejos de pádel
          </Eyebrow>

          <h1 className="font-display text-chalk text-[clamp(3.25rem,8vw,6.5rem)] leading-[0.86] font-black tracking-[-0.01em] uppercase [&>span]:block [&>span]:whitespace-nowrap">
            <span>Vos dormís.</span>
            <span>Tu cancha se</span>
            <span>
              reserva <span className="text-ball">sola.</span>
            </span>
          </h1>

          <p className="text-fog max-w-xl text-lg leading-relaxed text-pretty">
            GTP atiende el WhatsApp de tu complejo:{" "}
            <strong className="text-chalk font-semibold">
              responde a cada jugador, reserva el turno, cobra la seña por
              MercadoPago
            </strong>{" "}
            y te lo muestra todo en un panel. Las 24 horas, con tu número de
            siempre.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <LandingButton href="/register">
              Probar gratis 14 días
              <ArrowRight className="size-4.5" />
            </LandingButton>
            <LandingButton
              href={lumarsoftWhatsApp("demo")}
              external
              variant="chalk"
            >
              <WhatsAppIcon className="size-4.5" />
              Pedir una demo
            </LandingButton>
          </div>

          <dl className="border-chalk/10 grid w-full max-w-xl grid-cols-3 border-t pt-6">
            {FACTS.map((fact) => (
              <div
                key={fact.value}
                className="border-chalk/10 flex flex-col gap-1 border-l pl-3 first:border-l-0 first:pl-0 sm:pl-5"
              >
                <dt className="font-display text-chalk text-xl leading-none font-extrabold uppercase sm:text-3xl">
                  {fact.value}
                </dt>
                <dd className="text-fog text-xs leading-snug sm:text-sm">
                  {fact.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-fade-up flex justify-center [animation-delay:250ms] lg:justify-end">
          <FlapBoard />
        </div>
      </Container>
    </section>
  );
}
