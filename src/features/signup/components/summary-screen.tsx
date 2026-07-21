"use client";

import { Loader2, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { summaryGroups } from "@/features/signup/lib/summary";
import { firstName, type SignupAnswers } from "@/features/signup/lib/questions";

/**
 * The review. Everything they told us, read back in plain language and grouped the way the
 * conversation went, so it fits on a screen instead of being sixteen identical rows to
 * scroll. Every answer has a way back into it — nobody should send something they can't
 * check first, and a signup that can't be corrected is the fastest way to lose a lead on
 * the last screen.
 */
export function SummaryScreen({
  answers,
  onEdit,
  onSubmit,
  isSending,
}: {
  answers: SignupAnswers;
  onEdit: (questionId: string) => void;
  onSubmit: () => void;
  isSending: boolean;
}) {
  const groups = summaryGroups(answers);
  const name = firstName(answers);

  return (
    <div className="flex flex-col gap-7">
      <header data-animate="head" className="flex flex-col gap-2">
        <p className="text-brand text-xs font-medium tracking-wide uppercase">Ya está</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {name ? `Repasemos, ${name}` : "Repasemos"}
        </h1>
        <p className="text-muted-foreground text-pretty">
          Si algo no quedó bien, tocá el lápiz y lo corregís.
        </p>
      </header>

      {/* Columns, not a grid: a grid stretches every card in a row to the tallest one,
          which left a block of dead space under the short groups and pushed the whole
          review past a screen. Columns let each card be exactly as tall as its content. */}
      <div data-animate="head" className="gap-3 sm:columns-2 [&>section]:mb-3">
        {groups.map((group) => (
          <section
            key={group.title}
            className="border-border/70 bg-card/50 flex break-inside-avoid flex-col gap-2 rounded-2xl border p-4"
          >
            <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              {group.title}
            </h2>

            <dl className="flex flex-col gap-1.5">
              {group.rows.map((row) => (
                <div
                  key={`${row.questionId}-${row.label}`}
                  className="group flex items-start gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <dt className="text-muted-foreground text-xs">{row.label}</dt>
                    <dd
                      className={cn(
                        "text-sm text-pretty",
                        row.value
                          ? "font-medium"
                          : "text-muted-foreground/70 text-xs italic",
                      )}
                    >
                      {row.value ?? "Lo charlamos por teléfono"}
                    </dd>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Cambiar ${row.label}`}
                    onClick={() => onEdit(row.questionId)}
                    disabled={isSending}
                    // Never hover-only: on a phone there is no hover, and this is the one
                    // control the whole screen exists for.
                    className="text-muted-foreground hover:text-foreground shrink-0 opacity-50 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil />
                  </Button>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div data-animate="head" className="flex flex-col items-start gap-3">
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={onSubmit}
          disabled={isSending}
          className="h-12 px-6 text-base"
        >
          {isSending ? (
            <>
              <Loader2 className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send />
              Enviar y que me contacten
            </>
          )}
        </Button>
        {/* No account is created here — this is a request, and saying otherwise would be a
            promise the flow doesn't keep. */}
        <p className="text-muted-foreground text-xs">
          No creamos ninguna cuenta todavía: nos ponemos en contacto y lo vemos juntos.
        </p>
      </div>
    </div>
  );
}
