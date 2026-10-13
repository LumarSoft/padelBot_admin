import type { ReactNode } from "react";
import { CourtLines } from "@/features/landing/components/court-lines";
import { FlapBoard } from "@/features/landing/components/flap-board";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { Container, Eyebrow } from "@/features/landing/components/landing-ui";
import { LANDING_FONT_VARIABLES } from "@/features/landing/lib/fonts";
import { cn } from "@/lib/utils";

/**
 * Auth screens share the public site's look and keep its navbar, so someone
 * who landed on /login by mistake can always get back. On phones the form
 * comes first; the live board only joins on wide screens.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        LANDING_FONT_VARIABLES,
        "bg-ink text-chalk relative isolate flex min-h-svh flex-col overflow-x-clip",
      )}
    >
      <div aria-hidden className="bg-night-dots absolute inset-0 -z-10 opacity-60" />
      <CourtLines className="text-chalk/[0.045] absolute top-1/2 left-1/2 -z-10 hidden w-[150rem] max-w-none -translate-x-1/2 -translate-y-1/2 sm:block" />
      <div
        aria-hidden
        className="absolute -top-48 right-[-20%] -z-10 size-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-court)_45%,transparent),transparent)]"
      />

      <LandingHeader />

      <main className="flex flex-1 items-start lg:items-center">
        <Container className="grid gap-12 pt-8 pb-14 sm:pt-14 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-16 lg:py-16">
          <div className="hidden flex-col gap-8 lg:flex">
            <div className="flex flex-col gap-4">
              <Eyebrow className="text-ball">Mientras no estabas</Eyebrow>
              <p className="font-display text-[clamp(3rem,5vw,4.5rem)] leading-[0.88] font-black uppercase">
                Tu club siguió
                <br />
                reservando.
              </p>
              <p className="text-fog max-w-md text-lg text-pretty">
                Entrá y mirá lo que resolvió el bot: turnos nuevos, señas
                cobradas y chats atendidos.
              </p>
            </div>
            <FlapBoard className="max-w-[30rem]" />
          </div>

          <div className="animate-fade-up w-full">{children}</div>
        </Container>
      </main>
    </div>
  );
}
