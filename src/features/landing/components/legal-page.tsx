import type { ComponentProps, ReactNode } from "react";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";
import { Container } from "./landing-ui";
import { cn } from "@/lib/utils";

/**
 * Shared shell for the public legal / support pages (privacy policy, support).
 * Reuses the landing header + footer so these pages sit inside the marketing
 * site, and provides a small set of prose primitives — the project has no
 * Tailwind typography plugin, so headings/paragraphs are styled explicitly.
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <LandingHeader />
      <main className="flex-1 py-16 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-brand text-sm font-semibold tracking-wide uppercase">
            Legal
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Última actualización: {updatedAt}
          </p>
          {intro && (
            <p className="text-muted-foreground mt-6 text-lg text-pretty">
              {intro}
            </p>
          )}
          <div className="mt-10 flex flex-col gap-8">{children}</div>
        </Container>
      </main>
      <LandingFooter />
    </div>
  );
}

/** A titled section within a legal page. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      {children}
    </section>
  );
}

export function LegalP({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-base leading-relaxed text-pretty",
        className,
      )}
      {...props}
    />
  );
}

export function LegalUl({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "text-muted-foreground flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
