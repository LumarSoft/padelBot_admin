"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScheduleField } from "@/features/signup/components/schedule-field";
import {
  optionsFor,
  type ChoiceQuestion,
  type FieldsQuestion,
  type Question,
  type SignupAnswers,
} from "@/features/signup/lib/questions";

/**
 * One question, one screen. Choice questions are a single tap and advance on their own —
 * the whole point is that this reads as a conversation, not a form to fill out.
 */

function ChoiceGrid({
  question,
  answers,
  onAnswer,
}: {
  question: ChoiceQuestion;
  answers: SignupAnswers;
  onAnswer: (key: keyof SignupAnswers, value: unknown) => void;
}) {
  const current = answers[question.key];
  const options = optionsFor(question, answers);
  const reveal = question.reveal;
  const revealed = reveal && current === reveal.when;

  return (
    <>
    <div
      className={cn(
        "grid gap-3",
        question.columns === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {options.map((option) => {
        const selected = current === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            data-animate="option"
            onClick={() => onAnswer(question.key, option.value)}
            className={cn(
              "group ease-fluid relative flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
              "hover:border-brand/60 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg",
              question.centered ? "justify-center text-center" : "text-left",
              selected
                ? "border-brand bg-brand/10 shadow-[0_0_0_1px_var(--brand)]"
                : "border-border bg-card/50",
            )}
          >
            <span className={cn("min-w-0", !question.centered && "flex-1")}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-pretty">{option.label}</span>
                {option.badge && (
                  <span className="bg-brand/12 text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    {option.badge}
                  </span>
                )}
              </span>
              {option.hint && (
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {option.hint}
                </span>
              )}
            </span>
            {!question.centered && (
              <span
                className={cn(
                  "ease-spring flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  selected
                    ? "bg-brand border-brand scale-100 text-white"
                    : "border-border scale-90 opacity-0 group-hover:opacity-40",
                )}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>

    {/* An option that asks for more instead of moving on. The flow holds here (see the
        auto-advance guard in SignupFlow) because they haven't finished answering. */}
    {revealed && reveal && (
      <div data-animate="option" className="animate-fade-up flex flex-col gap-2">
        <Label htmlFor={`signup-${reveal.field.key}`}>{reveal.field.label}</Label>
        <Input
          id={`signup-${reveal.field.key}`}
          autoFocus
          value={String(answers[reveal.field.key] ?? "")}
          onChange={(e) => onAnswer(reveal.field.key, e.target.value)}
          maxLength={reveal.field.maxLength}
          placeholder={reveal.field.placeholder}
          className="h-12 rounded-xl px-3.5 text-base"
        />
      </div>
    )}
    </>
  );
}

function FieldsForm({
  question,
  answers,
  onAnswer,
  onSubmit,
  formId,
}: {
  question: FieldsQuestion;
  answers: SignupAnswers;
  onAnswer: (key: keyof SignupAnswers, value: unknown) => void;
  onSubmit: () => void;
  formId: string;
}) {
  const firstRef = useRef<HTMLInputElement>(null);

  // Focus the first field on arrival so a keyboard-only prospect never has to reach for
  // the mouse — the flow is meant to be typed and Entered straight through.
  useEffect(() => {
    firstRef.current?.focus();
  }, [question.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {question.fields.map((field, index) => {
        const raw = answers[field.key];
        // Prices live in cents in the answers, but they're typed in pesos.
        const value =
          field.cents && typeof raw === "number" ? String(raw / 100) : (raw ?? "");

        return (
          <div key={field.key} data-animate="option" className="flex flex-col gap-2">
            <Label htmlFor={`signup-${field.key}`}>{field.label}</Label>

            {field.type === "textarea" ? (
              <textarea
                id={`signup-${field.key}`}
                value={String(value)}
                onChange={(e) => onAnswer(field.key, e.target.value)}
                rows={3}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                className="border-input bg-foreground/[0.03] focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border px-3.5 py-2.5 text-base shadow-[inset_0_1px_2px_--alpha(var(--color-black)/4%)] outline-none focus-visible:ring-3 md:text-sm dark:bg-input/20"
              />
            ) : (
              <Input
                id={`signup-${field.key}`}
                ref={index === 0 ? firstRef : undefined}
                type={field.type === "number" ? "number" : field.type}
                inputMode={field.type === "number" ? "numeric" : undefined}
                min={field.type === "number" ? 0 : undefined}
                value={String(value)}
                onChange={(e) =>
                  onAnswer(
                    field.key,
                    field.cents
                      ? e.target.value === ""
                        ? undefined
                        : Math.round(Number(e.target.value) * 100)
                      : e.target.value,
                  )
                }
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                className="h-12 rounded-xl px-3.5 text-base"
              />
            )}
          </div>
        );
      })}
    </form>
  );
}

export function QuestionScreen({
  question,
  answers,
  onAnswer,
  onSubmit,
  formId,
}: {
  question: Question;
  answers: SignupAnswers;
  onAnswer: (key: keyof SignupAnswers, value: unknown) => void;
  /** Fields questions advance on Enter; choice questions advance on tap. */
  onSubmit: () => void;
  formId: string;
}) {
  const Icon = question.icon;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p
          data-animate="head"
          className="text-brand flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
        >
          <Icon className="size-3.5" />
          {question.eyebrow}
        </p>
        <h1
          data-animate="head"
          className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
        >
          {question.prompt(answers)}
        </h1>
        {question.help && (
          <p data-animate="head" className="text-muted-foreground max-w-lg text-pretty">
            {question.help(answers)}
          </p>
        )}
      </header>

      {question.kind === "choice" ? (
        <ChoiceGrid question={question} answers={answers} onAnswer={onAnswer} />
      ) : question.kind === "schedule" ? (
        <ScheduleField answers={answers} onAnswer={onAnswer} />
      ) : (
        <FieldsForm
          question={question}
          answers={answers}
          onAnswer={onAnswer}
          onSubmit={onSubmit}
          formId={formId}
        />
      )}
    </div>
  );
}
