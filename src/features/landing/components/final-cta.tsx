import { ArrowRight, MessageCircle } from "lucide-react";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { Container, LandingButton } from "./landing-ui";

export function FinalCta() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container>
        <div className="reveal relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--brand)_28%,transparent),transparent)]"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
              ¿Listo para que tu cancha se reserve sola?
            </h2>
            <p className="text-muted-foreground text-lg text-pretty">
              Creá tu club vos mismo y probalo gratis 14 días — o pedinos una demo
              de 15 minutos. Sin compromiso, sin tarjeta.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LandingButton href="/register" className="px-6 py-3.5 text-base">
                Probar gratis 14 días
                <ArrowRight className="size-4.5" />
              </LandingButton>
              <LandingButton
                href={lumarsoftWhatsApp("demo")}
                external
                variant="secondary"
                className="px-6 py-3.5 text-base"
              >
                <MessageCircle className="size-4.5" />
                Pedir una demo
              </LandingButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
