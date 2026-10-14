import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { CourtLines } from "./court-lines";
import { Container, Eyebrow, LandingButton } from "./landing-ui";

export function FinalCta() {
  return (
    <section className="bg-ball text-ink relative isolate overflow-hidden py-24 lg:py-36">
      <CourtLines className="text-ink/10 absolute top-1/2 left-1/2 -z-10 w-[120rem] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-[-8deg]" />

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="text-ink absolute top-1/2 right-[-6rem] -z-10 hidden size-[34rem] -translate-y-1/2 rotate-[24deg] lg:block xl:right-[-2rem]"
      >
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path
          d="M4.5 7.5c5.5 3 5.5 14 0 17M27.5 7.5c-5.5 3-5.5 14 0 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </svg>

      <Container className="flex flex-col items-start gap-8">
        <Eyebrow className="text-ink/70">Tu turno</Eyebrow>
        <h2 className="font-display text-[clamp(4.5rem,15vw,12rem)] leading-[0.8] font-black tracking-[-0.01em] uppercase">
          Te toca
          <br />
          sacar.
        </h2>
        <p className="text-ink/80 max-w-xl text-xl text-pretty">
          Probá GTP un mes gratis y sin tarjeta. O escribinos y te lo mostramos
          funcionando en una demo de 15 minutos.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <LandingButton href="/register" variant="ink" className="px-7 py-4 text-base">
            Probar 1 mes gratis
            <ArrowRight className="size-4.5" />
          </LandingButton>
          <LandingButton
            href={lumarsoftWhatsApp("demo")}
            external
            variant="line"
            className="px-7 py-4 text-base"
          >
            <WhatsAppIcon className="size-4.5" />
            Pedir una demo
          </LandingButton>
        </div>
      </Container>
    </section>
  );
}
