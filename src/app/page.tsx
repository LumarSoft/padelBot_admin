import type { Metadata } from "next";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { Reveal } from "@/features/landing/components/reveal";
import { Hero } from "@/features/landing/components/hero";
import { TrustMarquee } from "@/features/landing/components/trust-marquee";
import { ProblemSolution } from "@/features/landing/components/problem-solution";
import { BotFeatures } from "@/features/landing/components/bot-features";
import { MetricsBand } from "@/features/landing/components/metrics-band";
import { PanelShowcase } from "@/features/landing/components/panel-showcase";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { Faq } from "@/features/landing/components/faq";
import { FinalCta } from "@/features/landing/components/final-cta";
import { LandingFooter } from "@/features/landing/components/landing-footer";

export const metadata: Metadata = {
  title: "Canchea — Reservá canchas de pádel por WhatsApp",
  description:
    "El asistente con IA que atiende a tus jugadores por WhatsApp: reserva el turno, cobra la seña y concilia los pagos de MercadoPago solo. Vos lo controlás todo desde un panel en tiempo real.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <TrustMarquee />
        <Reveal>
          <ProblemSolution />
        </Reveal>
        <Reveal>
          <BotFeatures />
        </Reveal>
        <MetricsBand />
        <Reveal>
          <PanelShowcase />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <FinalCta />
        </Reveal>
      </main>
      <LandingFooter />
    </div>
  );
}
