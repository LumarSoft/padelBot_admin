import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared marketing primitives for the public landing. Kept separate from the
 * app's Base UI button so the landing can use larger, bespoke CTAs without
 * fighting the cramped in-app button sizes.
 */

const CTA_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50";

const CTA_VARIANTS = {
  primary:
    "bg-brand text-brand-foreground shadow-lg shadow-brand/25 hover:brightness-110",
  secondary:
    "border border-border bg-background/60 text-foreground backdrop-blur hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
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
  variant = "primary",
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

/** A subtle pill used for eyebrows and feature tags. */
export function Pill({
  children,
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </span>
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
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

/** Section heading block: eyebrow + title + optional lead paragraph. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("reveal flex max-w-2xl flex-col gap-4", className)}>
      {eyebrow && (
        <span className="text-brand text-sm font-semibold tracking-wide uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className="text-muted-foreground text-lg text-pretty">{lead}</p>
      )}
    </div>
  );
}
