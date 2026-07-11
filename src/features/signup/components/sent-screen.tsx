"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { lumarsoftWhatsApp, LUMARSOFT } from "@/lib/contact";
import { firstName, type SignupAnswers } from "@/features/signup/lib/questions";

gsap.registerPlugin(useGSAP, SplitText);

/**
 * The close.
 *
 * Nothing was created — this is a request — so the honest sequence (we write, we meet, and
 * only then does anything get set up) is also the least threatening one. Laid out as three
 * columns rather than stacked cards: they've just answered fifteen questions, and making
 * them scroll to find out what happens next is a poor thank-you.
 *
 * It earns one real animation, because it's the last thing they see: the tick draws itself,
 * the headline lands word by word (the same SplitText move the landing hero uses), and the
 * promise gets underlined by hand. No stock glyphs — the steps are numbered, which is what
 * the rest of the product does.
 */
const NEXT_STEPS = [
  {
    title: "Te escribimos",
    body: "Por WhatsApp, en el horario que elegiste.",
  },
  {
    title: "Nos juntamos",
    body: "Llegamos sabiendo cómo funciona tu complejo. No te hacemos explicar todo de nuevo.",
  },
  {
    title: "Lo dejamos andando",
    body: "Canchas, cobros y el WhatsApp del bot. Recién ahí existe tu cuenta.",
  },
];

/** A marker stroke swept under the words, drawn on arrival. */
function Underlined({ children }: { children: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      {/* A marker swipe, not a rule: it sits BEHIND the words and is thick enough to read
          as highlighter. `preserveAspectRatio: none` squashes the stroke vertically, which
          is why it's drawn so heavy in the viewBox. */}
      <svg
        aria-hidden
        className="text-brand/25 absolute -bottom-1 left-0 z-0 h-[0.85em] w-full"
        viewBox="0 0 300 16"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          data-draw
          data-underline
          d="M4 10 C 58 4, 122 3, 180 6 C 231 8, 268 6, 296 5"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function SentScreen({ answers }: { answers: SignupAnswers }) {
  const scope = useRef<HTMLDivElement>(null);
  const name = firstName(answers);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const strokes = gsap.utils.toArray<SVGPathElement>("[data-draw]");

      // Every stroke is drawn by walking its own dash offset back to zero.
      gsap.set(strokes, {
        strokeDasharray: (_i, el: SVGPathElement) => el.getTotalLength(),
        strokeDashoffset: (_i, el: SVGPathElement) => el.getTotalLength(),
      });

      // Everything here is born transparent (see .signup-stage in globals.css) so the
      // finished screen never flashes before it animates — which means every path out of
      // this callback has to reveal it, reduced motion included.
      const revealed = ["[data-badge]", "[data-title]", "[data-rise]"];

      if (reduced) {
        gsap.set(strokes, { strokeDashoffset: 0 });
        gsap.set(revealed, { opacity: 1, y: 0 });
        return;
      }

      const title = scope.current?.querySelector<HTMLElement>("[data-title]") ?? null;
      // The words are masked and rise into view, so the heading itself can be opaque.
      if (title) gsap.set(title, { opacity: 1 });
      const split = title ? SplitText.create(title, { type: "words", mask: "words" }) : null;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to("[data-check]", { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" })
        .fromTo(
          "[data-badge]",
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" },
          0,
        );

      if (split) {
        tl.from(
          split.words,
          { yPercent: 115, opacity: 0, duration: 0.7, ease: "power4.out", stagger: 0.04 },
          "-=0.35",
        );
      }

      tl.fromTo(
        "[data-rise]",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 },
        "-=0.4",
      )
        // The underline lands last, on a promise they've already read.
        .to("[data-underline]", { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, "-=0.5");
    },
    { scope },
  );

  return (
    <div ref={scope} className="flex flex-col items-center gap-9 text-center">
      {/* The tick draws itself — a stock check glyph would be the one lazy pixel on the
          screen they'll remember us by. */}
      <div
        data-badge
        className="flex size-16 items-center justify-center rounded-full bg-emerald-500/12 ring-1 ring-emerald-500/25"
      >
        <svg
          aria-hidden
          viewBox="0 0 48 48"
          className="size-9 text-emerald-600 dark:text-emerald-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path data-check data-draw d="M13 25 L21 33 L36 16" />
        </svg>
      </div>

      <div className="flex flex-col gap-4">
        <h1
          data-title
          className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {name ? `Qué bueno que des este paso, ${name}` : "Qué bueno que des este paso"}
        </h1>

        <p data-rise className="text-muted-foreground max-w-lg text-lg text-pretty">
          Sabemos lo que cuesta soltar el cuaderno y confiar en algo nuevo. No te vamos a
          dejar solo:{" "}
          <span className="text-foreground font-medium">
            <Underlined>te acompañamos en todo el proceso</Underlined>
          </span>
          .
        </p>
      </div>

      {/* Numbered, not iconified. The hairline rule ties the three into one path. */}
      <ol data-rise className="grid w-full gap-4 sm:grid-cols-3">
        {NEXT_STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2.5 text-left">
            <div className="flex items-center gap-3">
              <span className="text-brand font-mono text-xs font-semibold tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="from-brand/40 h-px flex-1 bg-linear-to-r to-transparent" />
            </div>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-muted-foreground text-xs text-pretty">{step.body}</p>
          </li>
        ))}
      </ol>

      <div data-rise className="flex flex-col items-center gap-3">
        <WhatsAppLink href={lumarsoftWhatsApp("hire")} className="h-12 px-5 text-base">
          ¿Apurado? Escribinos ahora
        </WhatsAppLink>
        <p className="text-muted-foreground text-xs">{LUMARSOFT.whatsappDisplay}</p>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mt-1 text-sm underline underline-offset-4 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
