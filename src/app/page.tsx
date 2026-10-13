import type { Metadata } from "next";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { Reveal } from "@/features/landing/components/reveal";
import { Hero } from "@/features/landing/components/hero";
import { Ticker } from "@/features/landing/components/ticker";
import { NightTimeline } from "@/features/landing/components/night-timeline";
import { Notebook } from "@/features/landing/components/notebook";
import { PanelShowcase } from "@/features/landing/components/panel-showcase";
import { CourtFeatures } from "@/features/landing/components/court-features";
import { SetupSteps } from "@/features/landing/components/setup-steps";
import { Faq } from "@/features/landing/components/faq";
import { FinalCta } from "@/features/landing/components/final-cta";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LANDING_FONT_VARIABLES } from "@/features/landing/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GTP — Tu cancha de pádel se reserva sola, por WhatsApp",
  description:
    "El bot de WhatsApp para complejos de pádel: responde a tus jugadores, reserva el turno, cobra la seña por MercadoPago y te lo muestra todo en un panel. Las 24 horas, con tu número de siempre.",
};

export default function LandingPage() {
  return (
    <div
      className={cn(
        LANDING_FONT_VARIABLES,
        "bg-ink text-chalk flex min-h-svh flex-col",
      )}
    >
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <Ticker />
        <NightTimeline />
        <Reveal>
          <Notebook />
        </Reveal>
        <Reveal>
          <PanelShowcase />
        </Reveal>
        <CourtFeatures />
        <Reveal>
          <SetupSteps />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
