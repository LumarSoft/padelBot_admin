import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { LockScreen } from "./lock-screen";
import { Container, LandingButton } from "./landing-ui";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-night-dots absolute inset-0 -z-10 opacity-50" />
      {/* A phone screen's glow in a dark bedroom. */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -z-10 h-[38rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-court)_55%,transparent),transparent)] lg:left-[28%]"
      />

      <Container className="grid gap-8 pt-6 pb-16 sm:gap-10 sm:pt-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14 lg:pt-16 lg:pb-24">
        <LockScreen className="animate-fade-up [&_ol>li:nth-child(3)]:hidden sm:[&_ol>li:nth-child(3)]:flex" />

        <div className="stagger-children flex flex-col items-start gap-5 sm:gap-6">
          <h1 className="font-display text-chalk text-[clamp(2.4rem,9vw,5rem)] leading-[0.88] font-black tracking-[-0.01em] text-balance uppercase">
            Vos dormías. GTP atendió, reservó y{" "}
            <span className="text-ball">cobró.</span>
          </h1>

          <p className="text-fog max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
            <strong className="text-chalk font-semibold">
              El bot de WhatsApp para complejos de pádel.
            </strong>{" "}
            Responde a tus jugadores, reserva el turno y cobra la seña por
            MercadoPago, con tu número de siempre. Vos lo ves todo en el panel.
          </p>

          <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <LandingButton href="/register" className="py-4 text-base">
              Probar 15 días gratis
              <ArrowRight className="size-4.5" />
            </LandingButton>
            <a
              href={lumarsoftWhatsApp("demo")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-chalk decoration-chalk/30 hover:decoration-ball inline-flex items-center justify-center gap-2 py-2 text-[15px] font-medium underline underline-offset-4 transition-colors"
            >
              <WhatsAppIcon className="text-turf size-4.5" />
              o pedí una demo por WhatsApp
            </a>
          </div>

          <p className="text-fog/80 text-sm">
            Sin tarjeta. Lo dejamos andando en 15 minutos.
          </p>
        </div>
      </Container>
    </section>
  );
}
