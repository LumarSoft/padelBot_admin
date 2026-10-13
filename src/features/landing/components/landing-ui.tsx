import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared marketing primitives for the public landing. Kept separate from the
 * app's Base UI button so the landing can use larger, bespoke CTAs without
 * fighting the cramped in-app button sizes.
 */

const CTA_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-all active:translate-y-px focus-visible:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50";

const CTA_VARIANTS = {
  /** Optic-yellow "ball" — the one primary action on any background. */
  ball: "bg-ball text-ink shadow-[0_10px_30px_-12px_var(--color-ball)] hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-ball/50",
  /** Outline for dark (ink/court) backgrounds. */
  chalk:
    "border border-chalk/25 text-chalk hover:border-chalk/60 hover:bg-chalk/5 focus-visible:ring-chalk/40",
  /** Solid dark button for light (paper/ball) backgrounds. */
  ink: "bg-ink text-chalk hover:-translate-y-0.5 hover:bg-ink-raised focus-visible:ring-ink/40",
  /** Outline for light backgrounds. */
  line: "border border-ink/20 text-ink hover:border-ink/50 hover:bg-ink/5 focus-visible:ring-ink/30",
} as const;

type CtaVariant = keyof typeof CTA_VARIANTS;

interface LandingButtonProps {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  /** External links (WhatsApp, mailto) render a plain <a> and open in a new tab. */
  external?: boolean;
  className?: string;
}

export function LandingButton({
  href,
  children,
  variant = "ball",
  external = false,
  className,
}: LandingButtonProps) {
  const classes = cn(CTA_BASE, CTA_VARIANTS[variant], className);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** Centers section content and applies the shared horizontal padding. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-8", className)}>
      {children}
    </div>
  );
}

/** Monospace scoreboard-style label above a section title. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-xs font-medium tracking-[0.18em] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Big condensed section headline. */
export function DisplayTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.88] font-extrabold tracking-[-0.01em] text-balance uppercase",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
