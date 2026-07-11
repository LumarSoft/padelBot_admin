"use client";

import { ArrowRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETUP_STEPS } from "@/features/setup/lib/steps";
import { cn } from "@/lib/utils";
import type { SetupStatus } from "@/types/api/onboarding";

/**
 * The welcome. Its job is to set expectations honestly — how long this takes, that nothing
 * is mandatory, and that everything can be changed later — so the owner doesn't feel they're
 * signing something irreversible.
 */
export function IntroScreen({
  clubName,
  status,
  onStart,
}: {
  clubName: string;
  status: SetupStatus;
  onStart: () => void;
}) {
  const started = status.steps.some((step) => step.done || step.acknowledged);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="from-brand to-brand/70 flex size-14 items-center justify-center rounded-2xl bg-linear-to-b text-2xl shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/25%)]">
          🎾
        </span>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {started ? `Sigamos con ${clubName}` : `Bienvenido, ${clubName}`}
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            {started
              ? "Retomamos donde lo dejaste. Todo lo que ya cargaste está guardado."
              : "Vamos a dejar tu complejo listo para que el bot empiece a tomar reservas. Te pregunto todo lo que necesita, en orden."}
          </p>
        </div>
      </div>

      <ol className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2">
        {SETUP_STEPS.map((step, index) => {
          const state = status.steps.find((s) => s.id === step.id);
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              className={cn(
                "border-border/60 bg-card/40 animate-fade-up flex items-center gap-3 rounded-xl border p-3",
                state?.done && "border-emerald-500/30 bg-emerald-500/[0.06]",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  state?.done
                    ? "text-emerald-600 dark:text-emerald-500"
                    : "text-muted-foreground",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{step.label}</span>
              {step.optional && (
                <span className="text-muted-foreground shrink-0 text-[10px]">opcional</span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col items-center gap-3">
        <Button type="button" variant="brand" size="lg" onClick={onStart}>
          {started ? "Continuar donde quedaste" : "Empezar"}
          <ArrowRight />
        </Button>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Clock3 className="size-3.5" />
          Unos 10 minutos. Podés saltear cualquier paso y cambiarlo después.
        </p>
      </div>
    </div>
  );
}
