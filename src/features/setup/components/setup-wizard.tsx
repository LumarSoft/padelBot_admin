"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SETUP_STEPS, stepIndex } from "@/features/setup/lib/steps";
import { useSaveSetupProgress, useSetupStatus } from "@/features/setup/hooks/use-setup";
import type { StepNav } from "@/features/setup/components/step-footer";
import { IntroScreen } from "@/features/setup/components/screens/intro-screen";
import { FinishScreen } from "@/features/setup/components/screens/finish-screen";
import { ComplejoStep } from "@/features/setup/components/steps/complejo-step";
import { CanchasStep } from "@/features/setup/components/steps/canchas-step";
import { PagosStep } from "@/features/setup/components/steps/pagos-step";
import { WhatsAppStep } from "@/features/setup/components/steps/whatsapp-step";
import { FijosStep } from "@/features/setup/components/steps/fijos-step";
import { EquipoStep } from "@/features/setup/components/steps/equipo-step";
import { KioscoStep } from "@/features/setup/components/steps/kiosco-step";
import { SETUP_STEP_IDS, type SetupStepId, type SetupStatus } from "@/types/api/onboarding";

/** Screens the wizard can be on: the welcome, one of the steps, or the closing screen. */
type Screen = "intro" | SetupStepId | "listo";

export interface StepProps {
  clubName: string;
  status: SetupStatus;
  nav: StepNav;
}

const STEP_COMPONENTS: Record<SetupStepId, (props: StepProps) => React.ReactNode> = {
  complejo: ComplejoStep,
  canchas: CanchasStep,
  pagos: PagosStep,
  whatsapp: WhatsAppStep,
  fijos: FijosStep,
  equipo: EquipoStep,
  kiosco: KioscoStep,
};

function isScreen(value: string | null): value is Screen {
  return (
    value === "intro" ||
    value === "listo" ||
    (SETUP_STEP_IDS as readonly string[]).includes(value ?? "")
  );
}

export function SetupWizard({ clubName }: { clubName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusQuery = useSetupStatus();
  const saveProgress = useSaveSetupProgress();

  // The screen lives in the URL, not in state: MercadoPago's OAuth callback bounces the
  // owner's browser out of the app and back to `/setup?step=pagos`, and they must land on
  // the step they left. It also makes Back/Forward behave.
  const requested = searchParams.get("step");
  const screen: Screen = isScreen(requested) ? requested : "intro";

  const status = statusQuery.data;

  const goTo = useCallback(
    (next: Screen, markDone?: SetupStepId) => {
      router.replace(`/setup?step=${next}`, { scroll: false });
      window.scrollTo({ top: 0 });

      // Persist the position so an interrupted setup resumes here. Fire-and-forget:
      // the step's real data is already saved, so a failed position write changes nothing.
      const done = new Set(
        status?.steps.filter((s) => s.acknowledged).map((s) => s.id) ?? [],
      );
      if (markDone) done.add(markDone);
      saveProgress.mutate({
        currentStep: next === "intro" || next === "listo" ? null : next,
        doneSteps: [...done],
      });
    },
    [router, saveProgress, status],
  );

  const nav: StepNav = useMemo(() => {
    const current = isScreen(requested) && requested !== "intro" && requested !== "listo"
      ? (requested as SetupStepId)
      : null;
    const index = current ? stepIndex(current) : -1;
    const isLast = index === SETUP_STEPS.length - 1;

    const advance = (markDone: boolean) => {
      const next: Screen = isLast ? "listo" : SETUP_STEPS[index + 1].id;
      goTo(next, markDone && current ? current : undefined);
    };

    return {
      onBack: () => goTo(index <= 0 ? "intro" : SETUP_STEPS[index - 1].id),
      onSkip: () => advance(false),
      onNext: () => advance(true),
      isFirst: index <= 0,
      isLast,
    };
  }, [goTo, requested]);

  if (statusQuery.isLoading || !status) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Preparando la puesta a punto…
      </div>
    );
  }

  const doneCount = status.steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / status.steps.length) * 100);
  const isMoment = screen === "intro" || screen === "listo";

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[17rem_1fr]">
      <div aria-hidden className="ambient-bg" />

      {/* Step rail */}
      <aside className="glass-panel border-border/60 sticky top-0 hidden h-svh flex-col border-r px-4 py-5 lg:flex">
        <div className="px-1">
          <Logo />
        </div>

        <div className="mt-6 px-1">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-medium">Puesta a punto</p>
            <span className="text-muted-foreground text-xs tabular-nums">{progress}%</span>
          </div>
          <div className="bg-foreground/[0.06] h-1.5 w-full overflow-hidden rounded-full dark:bg-white/[0.07]">
            <div
              className="bg-brand h-full rounded-full transition-[width] duration-700 ease-fluid"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
          {SETUP_STEPS.map((step) => {
            const state = status.steps.find((s) => s.id === step.id);
            const isDone = state?.done ?? false;
            const isCurrent = screen === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goTo(step.id)}
                className={cn(
                  "ease-fluid flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-200",
                  isCurrent
                    ? "bg-card/70 ring-foreground/[0.06] shadow-[inset_0_1px_0_0_var(--glass-highlight)] ring-1"
                    : "hover:bg-card/40",
                )}
              >
                <span
                  className={cn(
                    "ease-spring flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                    isDone
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500"
                      : isCurrent
                        ? "bg-brand text-white"
                        : "bg-foreground/[0.05] text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check className="animate-scale-in size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm",
                      isCurrent ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </span>
                {step.optional && !isDone && (
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    opcional
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <Link
          href="/panel"
          className="text-muted-foreground hover:text-foreground mt-4 flex items-center gap-2 px-2.5 text-xs transition-colors"
        >
          <X className="size-3.5" />
          Salir al panel
        </Link>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-col">
        <header className="border-border/60 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-8 lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/panel"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Salir
            </Link>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:px-8 md:py-12",
            // The intro and the closing screen are moments, not forms — center them.
            isMoment && "justify-center",
          )}
        >
          {/* Keyed on the screen so every transition replays the entrance animation. */}
          <div key={screen} className="animate-fade-up">

            {screen === "intro" ? (
              <IntroScreen
                clubName={clubName}
                status={status}
                onStart={() => goTo(status.currentStep ?? SETUP_STEPS[0].id)}
              />
            ) : screen === "listo" ? (
              <FinishScreen clubName={clubName} status={status} onGoToStep={goTo} />
            ) : (
              (() => {
                const Step = STEP_COMPONENTS[screen];
                return <Step clubName={clubName} status={status} nav={nav} />;
              })()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
