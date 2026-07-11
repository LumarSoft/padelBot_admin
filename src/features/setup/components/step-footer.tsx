"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Navigation the wizard shell hands to every step. */
export interface StepNav {
  onBack: () => void;
  /** Move on without configuring this step — always allowed. */
  onSkip: () => void;
  /** Move on, marking this step as visited. */
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Shared footer for every step. "Omitir" is always offered, deliberately: a setup done
 * sitting with the owner stalls constantly (they don't have the MercadoPago password on
 * them, the fixed-slot list is in a notebook at the club) and the wizard must never be
 * the thing that blocks them. Everything here is editable later from Configuración.
 */
export function StepFooter({
  nav,
  /** The step's own "save and continue" action. Omit to just advance. */
  primary,
  skipLabel = "Omitir por ahora",
}: {
  nav: StepNav;
  primary?: ReactNode;
  skipLabel?: string;
}) {
  return (
    <div className="border-border/60 mt-2 flex items-center justify-between gap-3 border-t pt-5">
      <Button
        type="button"
        variant="ghost"
        size="lg"
        onClick={nav.onBack}
        disabled={nav.isFirst}
      >
        <ArrowLeft />
        Atrás
      </Button>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="lg" onClick={nav.onSkip}>
          {skipLabel}
        </Button>
        {primary ?? (
          <Button type="button" variant="brand" size="lg" onClick={nav.onNext}>
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
