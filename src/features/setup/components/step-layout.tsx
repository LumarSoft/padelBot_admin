"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { stepIndex, stepMeta } from "@/features/setup/lib/steps";
import { SETUP_STEPS } from "@/features/setup/lib/steps";
import type { SetupStepId } from "@/types/api/onboarding";

/**
 * Frame every step shares: a numbered heading, the step's content, and — when the step has
 * a visible consequence for the player — a live preview of the bot beside it.
 */
export function StepLayout({
  id,
  children,
  preview,
  footer,
}: {
  id: SetupStepId;
  children: ReactNode;
  /** Live bot preview. Steps with no player-facing effect (equipo) pass nothing. */
  preview?: ReactNode;
  footer: ReactNode;
}) {
  const meta = stepMeta(id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Paso {stepIndex(id) + 1} de {SETUP_STEPS.length}
          {meta.optional && " · opcional"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {meta.title}
        </h1>
        <p className="text-muted-foreground max-w-xl text-pretty">{meta.description}</p>
      </header>

      <div
        className={cn(
          "grid gap-8",
          preview ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "grid-cols-1",
        )}
      >
        <div className="flex min-w-0 flex-col gap-6">{children}</div>

        {preview && (
          <aside className="lg:sticky lg:top-8 lg:self-start">{preview}</aside>
        )}
      </div>

      {footer}
    </div>
  );
}
