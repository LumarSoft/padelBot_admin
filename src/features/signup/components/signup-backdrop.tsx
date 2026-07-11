"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CHAPTER_MOODS } from "@/features/signup/lib/chapters";
import type { ChapterId } from "@/features/signup/lib/questions";

/**
 * The room the signup happens in.
 *
 * Three soft glows drift to new positions and cross-fade to a new palette on every chapter
 * change, over a padel court drawn so faintly it reads as texture rather than decoration.
 * The point is that the environment *responds*: the prospect is walking through a space,
 * not scrolling a form on a background image.
 *
 * Everything here is decorative — `aria-hidden`, pointer-events none, and it holds still
 * for anyone who asked for reduced motion.
 */
export function SignupBackdrop({ chapter }: { chapter: ChapterId }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mood = CHAPTER_MOODS[chapter];
      const glows = gsap.utils.toArray<HTMLElement>("[data-glow]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      glows.forEach((glow, i) => {
        const target = mood.glows[i];
        if (!target) return;

        // Recolour and reposition. `xPercent`/`yPercent` keep it centered on its own box,
        // and left/top carry the actual position so it scales with the viewport.
        gsap.to(glow, {
          backgroundColor: target.color,
          left: `${target.x}%`,
          top: `${target.y}%`,
          scale: target.scale,
          duration: reduced ? 0 : 1.6,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      });

      if (reduced) return;

      // A slow idle drift on top, so the light is never completely still.
      const drifts = glows.map((glow, i) =>
        gsap.to(glow, {
          xPercent: `+=${i % 2 === 0 ? 6 : -6}`,
          yPercent: `+=${i % 2 === 0 ? -5 : 5}`,
          duration: 9 + i * 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        }),
      );
      return () => drifts.forEach((d) => d.kill());
    },
    { scope, dependencies: [chapter] },
  );

  return (
    <div
      ref={scope}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          data-glow
          // -translate keeps the blob centered on its left/top coordinate.
          className="absolute size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.24] blur-[130px] dark:opacity-[0.34]"
          style={{
            left: `${CHAPTER_MOODS.complejo.glows[i].x}%`,
            top: `${CHAPTER_MOODS.complejo.glows[i].y}%`,
            backgroundColor: CHAPTER_MOODS.complejo.glows[i].color,
          }}
        />
      ))}

      {/* A padel court, laid in like a blueprint bleeding off the corner. It's what they
          sell — having it faintly present is what makes this screen theirs and nobody
          else's. Rotated and off-centre on purpose: squared up and full-bleed it stops
          reading as a court and starts reading as a grid chopping the page into panels. */}
      <svg
        className="absolute -right-[12%] -bottom-[18%] w-[min(110vw,70rem)] rotate-[-9deg] text-foreground opacity-[0.09] [mask-image:linear-gradient(to_top_left,black,transparent_70%)] dark:opacity-[0.13]"
        viewBox="0 0 200 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.35"
        vectorEffect="non-scaling-stroke"
      >
        {/* Outer walls, service lines, net. */}
        <rect x="10" y="10" width="180" height="80" rx="1" />
        <line x1="100" y1="10" x2="100" y2="90" strokeDasharray="2 2.5" />
        <line x1="40" y1="10" x2="40" y2="90" />
        <line x1="160" y1="10" x2="160" y2="90" />
        <line x1="40" y1="50" x2="10" y2="50" />
        <line x1="160" y1="50" x2="190" y2="50" />
      </svg>

      {/* Fine grain: keeps the big blurred gradients from banding. Soft-light rather than
          overlay, which blew out the light theme into a dirty grey. */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-soft-light dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
