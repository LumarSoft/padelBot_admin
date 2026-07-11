"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import {
  QUESTIONS,
  canAdvance,
  isAnswered,
  type SignupAnswers,
} from "@/features/signup/lib/questions";
import { CHAPTER_MOODS, CLOSING_CHAPTER } from "@/features/signup/lib/chapters";
import { clearDraft, loadDraft, saveDraft } from "@/features/signup/lib/draft";
import { DEFAULT_CLOSE, DEFAULT_OPEN } from "@/features/signup/lib/schedule-preview";
import { QuestionScreen } from "@/features/signup/components/question-screen";
import { SignupBackdrop } from "@/features/signup/components/signup-backdrop";
import { SummaryScreen } from "@/features/signup/components/summary-screen";
import { SentScreen } from "@/features/signup/components/sent-screen";

gsap.registerPlugin(useGSAP);

/** Screens: one per question, then the review, then the confirmation. */
const SUMMARY = QUESTIONS.length;
const SENT = QUESTIONS.length + 1;

/** How long the choice card stays lit before the flow moves on. */
const AUTO_ADVANCE_MS = 260;

export function SignupFlow() {
  // Read once, at first render. This component is mounted client-only (see
  // signup-flow-client.tsx), so touching localStorage here can't desync a server-rendered
  // tree — and it means the restored answers are simply the initial state, rather than
  // something an effect has to patch in afterwards.
  const [restored] = useState(() => {
    const draft = loadDraft();
    return draft && Object.keys(draft.answers).length > 0 ? draft : null;
  });

  const [answers, setAnswers] = useState<SignupAnswers>(() => ({
    // The schedule question opens on the most common day, so a club that matches it can
    // just hit Continuar. See DEFAULT_OPEN — these are real answers, not just pixels.
    openTime: DEFAULT_OPEN,
    closeTime: DEFAULT_CLOSE,
    // A restored answer wins — unless it's empty. A draft left by an earlier version of
    // this flow can carry an untouched `openTime: ""`, and letting that blank overwrite a
    // default would silently disable Continuar on a question that looks answered.
    ...Object.fromEntries(
      Object.entries(restored?.answers ?? {}).filter(([, v]) => v !== undefined && v !== ""),
    ),
  }));
  const [index, setIndex] = useState(
    // Never resume onto the confirmation screen, and never past the review.
    restored ? Math.min(Math.max(restored.index, 0), SUMMARY) : 0,
  );
  // Enter animations are direction-aware: forward rises from below, back drops from above.
  const [direction, setDirection] = useState<1 | -1>(1);
  // True while they're correcting a single answer from the review. Answering it sends them
  // straight back to the review — being made to re-walk every remaining question just to
  // fix a typo is exactly how you lose someone on the last screen.
  const [editing, setEditing] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tell them their answers came back — silently teleporting someone to question 9 is
  // disorienting. Restoring is the right default, but it must not be a trap, so the way
  // out sits right where they learn about it.
  useEffect(() => {
    if (!restored) return;
    toast("Retomamos donde lo dejaste", {
      description: "Tus respuestas quedaron guardadas en este dispositivo.",
      duration: 8000,
      action: {
        label: "Empezar de nuevo",
        onClick: () => {
          clearDraft();
          // Back to a clean form — which still means the schedule's defaults, not nothing.
          setAnswers({ openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE });
          setIndex(0);
          setEditing(false);
        },
      },
    });
  }, [restored]);

  // Keep the draft current. A long flow that a stray reload wipes is a lead thrown away.
  useEffect(() => {
    if (index >= SENT) return;
    saveDraft(answers, index);
  }, [answers, index]);

  const question = QUESTIONS[index];
  const isQuestion = index < SUMMARY;
  const formId = `signup-form-${question?.id ?? "none"}`;
  // Questions that don't advance on their own, because the answer is still being composed.
  const needsConfirm =
    !!question &&
    (question.kind !== "choice" ||
      (!!question.reveal && answers[question.key] === question.reveal.when));
  // The backdrop follows the act they're in; the review and the confirmation share the
  // closing mood, so the light settles instead of jumping at the end.
  const chapter = question?.chapter ?? CLOSING_CHAPTER;

  const submit = useMutation({
    mutationFn: (body: SignupAnswers) =>
      apiClient.post<{ received: boolean }>("/api/onboarding/request", body),
    onSuccess: () => {
      // It's ours now: their phone and email have no business lingering in the browser,
      // and coming back must not drop them into a form they already sent.
      clearDraft();
      go(SENT, 1);
    },
    onError: (error: Error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No pudimos enviar tus datos. Probá de nuevo.",
      ),
  });

  const go = useCallback((next: number, dir: 1 | -1) => {
    setDirection(dir);
    setIndex(next);
    window.scrollTo({ top: 0 });
  }, []);

  // Re-runs on every screen change: the heading and then the options cascade in, rising
  // from below going forward and dropping from above going back.
  //
  // The animated elements are born transparent (`.signup-enter` in globals.css) and GSAP
  // is what reveals them. Letting React paint them visible and *then* having GSAP set the
  // from-state flashed the finished question for a frame before it animated in. GSAP's
  // inline styles outrank the class, so once it takes over the class stops mattering —
  // which also means the reduced-motion path MUST still reveal them, or they'd never show.
  useGSAP(
    () => {
      const targets = ['[data-animate="head"]', '[data-animate="option"]'];
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      // `fromTo` rather than `from`: `from` only *implies* the end state, so a screen
      // swapped mid-tween could leave its cards stuck invisible. Stating both ends means
      // the worst case is a skipped animation, never an unreadable question.
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          targets[0],
          { y: 18 * direction, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
        )
        .fromTo(
          targets[1],
          { y: 16 * direction, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.05 },
          "-=0.3",
        );
    },
    { scope, dependencies: [index], revertOnUpdate: true },
  );

  /** Where answering the current question lands: back to the review, or on to the next one. */
  function destination(): number {
    return editing ? SUMMARY : index + 1;
  }

  function setAnswer(key: keyof SignupAnswers, value: unknown): void {
    setAnswers((prev) => ({ ...prev, [key]: value }));

    if (question?.kind !== "choice") return;

    // An option that opens a field ("un horario puntual") is not a finished answer — they
    // still have to type it. Auto-advancing would yank the input out from under them.
    const opensAField = question.reveal && key === question.key && value === question.reveal.when;
    // Typing INTO that field must not advance either.
    const typingInRevealed = key !== question.key;
    if (opensAField || typingInRevealed) return;

    // Otherwise a tapped choice IS the answer — moving on by itself is what keeps this from
    // feeling like a form. The brief pause lets them see the card light up before it goes.
    const target = destination();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setEditing(false);
      go(target, editing ? -1 : 1);
    }, AUTO_ADVANCE_MS);
  }

  function next(): void {
    if (!question || !canAdvance(question, answers)) return;
    const target = destination();
    setEditing(false);
    go(target, editing ? -1 : 1);
  }

  function back(): void {
    // Backing out of a correction returns to the review, not into the middle of the flow.
    if (editing) {
      setEditing(false);
      go(SUMMARY, -1);
      return;
    }
    if (index === 0) return;
    go(index - 1, -1);
  }

  function send(): void {
    // The API only requires the contact fields; everything skipped is simply absent.
    const payload = Object.fromEntries(
      Object.entries(answers).filter(([, value]) => value !== undefined && value !== ""),
    ) as SignupAnswers;
    submit.mutate(payload);
  }

  // Progress = questions LEFT BEHIND, not questions with a value in them. Deriving it from
  // the answers made the bar creep forward mid-keystroke, which reads as the page reacting
  // to typing rather than to progress. It should move when they commit — on Continuar, on
  // a tapped choice, on a skip. While correcting from the review it stays full: they're
  // not walking the flow backwards, they're touching up a finished one.
  const progress =
    index >= SUMMARY || editing ? 100 : Math.round((index / QUESTIONS.length) * 100);

  return (
    <div className="relative flex min-h-svh flex-col">
      <SignupBackdrop chapter={chapter} />

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 md:px-8">
        <Link href="/" aria-label="Volver al inicio">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      {/* Progress. Hidden on the confirmation — nothing left to progress toward. */}
      {index < SENT && (
        <div className="relative z-10 mx-auto w-full max-w-2xl px-4 md:px-8">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            {/* The chapter name, so the drifting light always has a meaning attached. */}
            <span
              key={chapter}
              className="animate-fade-up text-muted-foreground text-xs font-medium tracking-wide uppercase"
            >
              {index >= SUMMARY ? "Repaso" : CHAPTER_MOODS[chapter].label}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {index >= SUMMARY ? "Listo" : `${index + 1} / ${QUESTIONS.length}`}
            </span>
          </div>
          <div className="bg-foreground/[0.07] h-1 w-full overflow-hidden rounded-full dark:bg-white/[0.08]">
            <div
              className="bg-brand ease-fluid h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <main
        ref={scope}
        className="signup-stage relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 md:px-8 md:py-14"
      >
        {isQuestion ? (
          <QuestionScreen
            question={question}
            answers={answers}
            onAnswer={setAnswer}
            onSubmit={next}
            formId={formId}
          />
        ) : index === SUMMARY ? (
          <SummaryScreen
            answers={answers}
            onEdit={(questionId) => {
              const target = QUESTIONS.findIndex((q) => q.id === questionId);
              if (target < 0) return;
              setEditing(true);
              go(target, -1);
            }}
            onSubmit={send}
            isSending={submit.isPending}
          />
        ) : (
          <SentScreen answers={answers} />
        )}
      </main>

      {/* Navigation. A tapped choice advances itself, so a Continuar button is only needed
          where they're still composing an answer: typed questions, the schedule, and the
          choice whose selected option opened a field. */}
      {isQuestion && (
        <footer className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 pb-10 md:px-8">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={back}
            disabled={index === 0 && !editing}
            className={cn(index === 0 && !editing && "invisible")}
          >
            <ArrowLeft />
            {editing ? "Volver al resumen" : "Atrás"}
          </Button>

          <div className="flex items-center gap-2">
            {question.optional && !isAnswered(question, answers) && (
              <Button type="button" variant="ghost" size="lg" onClick={next}>
                Prefiero contarlo después
              </Button>
            )}
            {needsConfirm && (
              <Button
                // Typed questions submit their form (so Enter works); the others are just
                // a click, because there's no form to submit.
                type={question.kind === "fields" ? "submit" : "button"}
                form={question.kind === "fields" ? formId : undefined}
                onClick={question.kind === "fields" ? undefined : next}
                variant="brand"
                size="lg"
                disabled={!canAdvance(question, answers)}
                className="h-11 px-5"
              >
                {editing ? "Guardar" : "Continuar"}
                <ArrowRight />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
