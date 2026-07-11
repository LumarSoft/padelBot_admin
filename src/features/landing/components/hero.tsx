"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { Container, LandingButton, Pill } from "./landing-ui";
import { WhatsAppMock } from "./whatsapp-mock";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = scope.current?.querySelector<HTMLElement>(".hero-title");
        const split = title
          ? SplitText.create(title, { type: "words", mask: "words" })
          : null;

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Keep the chat bubbles and floating card hidden until their cue.
        tl.set(".chat-bubble", { opacity: 0, y: 14 }, 0).set(
          ".panel-float",
          { opacity: 0, y: 16, scale: 0.92 },
          0,
        );

        if (split) {
          tl.from(split.words, {
            yPercent: 115,
            opacity: 0,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.045,
          });
        }

        tl.from(
          ".hero-reveal",
          { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 },
          split ? "-=0.45" : 0,
        )
          .from(
            ".hero-mock",
            { y: 40, opacity: 0, scale: 0.96, duration: 1 },
            "-=0.6",
          )
          .to(
            ".chat-bubble",
            { opacity: 1, y: 0, stagger: 0.14, duration: 0.5 },
            "-=0.5",
          )
          .to(
            ".panel-float",
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
            "-=0.1",
          )
          // Gentle idle float once the mock has landed.
          .to(".hero-mock", {
            y: -10,
            duration: 2.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });

        // Scroll parallax: glow drifts down, the mock lifts a touch.
        gsap.to(".hero-glow", {
          yPercent: 24,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to(".hero-mock-wrap", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        return () => split?.revert();
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative overflow-hidden">
      {/* Brand "aurora" glow backdrop */}
      <div
        aria-hidden
        className="hero-glow animate-aurora pointer-events-none absolute inset-x-0 -top-40 h-[40rem] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--brand)_24%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40"
      />

      <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <Pill className="hero-reveal">
            <Sparkles className="text-brand size-3.5" />
            Bot de WhatsApp con IA + panel para tu complejo
          </Pill>

          <h1 className="hero-title text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Tu cancha se reserva sola,{" "}
            <span className="text-brand">hasta a las 3 de la mañana</span>
          </h1>

          <p className="hero-reveal text-muted-foreground max-w-xl text-lg text-pretty">
            PadelBot es el asistente que atiende a tus jugadores por WhatsApp:
            reserva el turno, pide la seña y concilia el pago de MercadoPago
            solo. Vos lo mirás todo desde un panel, en tiempo real.
          </p>

          <div className="hero-reveal flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <p className="hero-reveal text-muted-foreground text-sm">
            Puesta en marcha en ~15 minutos · Sin cambiar tu número · Sin tarjeta
          </p>
        </div>

        <div className="hero-mock-wrap flex justify-center lg:justify-end">
          <WhatsAppMock className="hero-mock" />
        </div>
      </Container>
    </section>
  );
}
