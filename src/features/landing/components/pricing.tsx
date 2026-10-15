import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Mic,
  Minus,
  Paperclip,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  COMPARISON,
  MAX_AI_CREDITS,
  PLANS,
  TRIAL_LABEL,
  dailyCeilingCents,
  discountPercent,
  formatCount,
  type Plan,
  type PlanCell,
} from "../lib/plans";
import { Container, DisplayTitle, Eyebrow, LandingButton } from "./landing-ui";
import { OpenComparisonLink } from "./open-comparison-link";

const CREDITS_POPOVER_ID = "creditos-ia";
const COMPARISON_ID = "comparar-planes";

/** What every plan has — said once, above the cards, instead of on each of them. */
const PERKS = [
  "Sin tarjeta",
  "0% de comisión por reserva",
  "Sin permanencia",
  "Puesta en marcha incluida",
];

function CheckDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-ball/15 text-ball flex size-4 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <Check className="size-2.5" strokeWidth={3.5} />
    </span>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.recommended ?? false;
  // Never let the smallest allowance draw an empty-looking bar.
  const creditShare = Math.max(6, Math.round((plan.aiCredits / MAX_AI_CREDITS) * 100));

  return (
    <article
      className={cn(
        "reveal relative flex w-[85%] max-w-sm shrink-0 snap-start flex-col gap-5 rounded-3xl border p-6 sm:w-[55%] sm:p-7 lg:w-auto lg:max-w-none",
        featured
          ? "border-ball/45 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--color-ball)_8%,var(--color-ink-raised)),var(--color-ink))] shadow-[0_30px_90px_-50px_var(--color-ball)]"
          : "border-chalk/10 bg-[linear-gradient(180deg,var(--color-ink-raised),var(--color-ink))]",
      )}
    >
      {featured && (
        <span className="bg-ball text-ink absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
          Recomendado
        </span>
      )}

      <header className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl leading-none font-black uppercase">
          {plan.name}
        </h3>
        <p className="text-chalk/55 text-sm">
          {plan.courts === null ? "Canchas sin límite" : `Hasta ${plan.courts} canchas`}
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-2 text-sm">
          <s className="text-chalk/40 tabular-nums">
            <span className="sr-only">Precio regular: </span>
            {formatPrice(plan.regularPriceCents)}
          </s>
          <span className="bg-ball/15 text-ball rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider">
            {discountPercent(plan)}% OFF
          </span>
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-chalk/60 text-xl font-semibold">$</span>
          <span className="font-display text-6xl leading-none font-black tracking-tight tabular-nums">
            {formatCount(plan.priceCents / 100)}
          </span>
          <span className="text-chalk/50 ml-1 text-sm">/mes</span>
        </p>
        <p className="text-chalk/45 text-xs">
          Menos de {formatPrice(dailyCeilingCents(plan.priceCents))} por día
        </p>
      </div>

      <div className="border-court/50 bg-court/15 rounded-2xl border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-3xl leading-none font-black tabular-nums">
            {formatCount(plan.aiCredits)}
          </span>
          <button
            type="button"
            popoverTarget={CREDITS_POPOVER_ID}
            className="text-chalk/60 hover:text-chalk focus-visible:ring-ball/50 inline-flex items-center gap-1 rounded-full text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            créditos IA / mes
            <CircleHelp aria-hidden className="size-3.5" />
          </button>
        </div>
        <div aria-hidden className="bg-chalk/10 mt-3 h-1.5 overflow-hidden rounded-full">
          <div className="bg-ball h-full rounded-full" style={{ width: `${creditShare}%` }} />
        </div>
      </div>

      <p className="border-chalk/10 bg-chalk/[0.03] rounded-2xl border px-4 py-3 text-sm">
        <span className="font-semibold">
          {plan.users === null ? "Usuarios sin límite" : `${plan.users} usuarios`}
        </span>{" "}
        <span className="text-chalk/50 text-xs">en el panel y la app</span>
      </p>

      <LandingButton
        // The signup keeps the card they picked and the ops alert shows it.
        href={`/register?plan=${plan.key}`}
        variant={featured ? "ball" : "chalk"}
        className={cn("w-full py-3", !featured && "bg-chalk/[0.06]")}
      >
        Probar {TRIAL_LABEL}
        <ArrowRight className="size-4" />
      </LandingButton>

      <div className="border-chalk/10 flex flex-col gap-3 border-t pt-5">
        <p className="text-chalk/50 text-xs font-medium">
          {plan.includesFrom ? `Todo lo de ${plan.includesFrom}, más:` : "Incluye:"}
        </p>
        <ul className="flex flex-col gap-2.5 text-sm">
          {plan.highlights.map((highlight) => (
            <li key={highlight} className="flex items-center gap-2.5">
              <CheckDot />
              <span className="text-chalk/80">{highlight}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5">
            <span className="bg-chalk/10 text-chalk/70 flex size-4 shrink-0 items-center justify-center rounded-full">
              <Plus className="size-2.5" strokeWidth={3.5} />
            </span>
            <OpenComparisonLink
              targetId={COMPARISON_ID}
              className="text-chalk/80 decoration-chalk/25 hover:text-ball hover:decoration-ball/50 underline underline-offset-4 transition-colors"
            >
              Todas las funcionalidades
            </OpenComparisonLink>
          </li>
        </ul>
      </div>
    </article>
  );
}

function PlayerBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md bg-[oklch(0.5_0.13_155)] px-3.5 py-2 text-sm text-white">
        {children}
        <CheckCheck className="size-3.5 shrink-0 opacity-70" />
      </p>
    </div>
  );
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <p className="bg-chalk text-ink max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm">
        {children}
      </p>
    </div>
  );
}

/** A voice note's waveform, drawn as bars. */
function Waveform() {
  const bars = [5, 9, 14, 8, 12, 6, 10, 15, 7, 11, 5, 9];
  return (
    <span aria-hidden className="flex h-4 items-center gap-0.5">
      {bars.map((height, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-white/80"
          style={{ height }}
        />
      ))}
    </span>
  );
}

/** Marks a bot message in the chat: each one the bot sends uses a credit. */
function CreditTag() {
  return (
    <p className="text-ball -mt-0.5 mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
      <Sparkles aria-hidden className="size-3" />1 crédito
    </p>
  );
}

/**
 * "¿Qué son los créditos de IA?", opened from any card. A native popover: top layer,
 * light dismiss and Esc for free, no client JS. Its own element must not get a `display`
 * class — that would override the browser's `display: none` while it's closed.
 */
function CreditsPopover() {
  return (
    <div
      id={CREDITS_POPOVER_ID}
      popover="auto"
      className="bg-ink-raised text-chalk border-chalk/10 backdrop:bg-ink/70 m-auto max-h-[calc(100svh-2rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border p-6 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)] backdrop:backdrop-blur-sm sm:p-7"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-ball font-mono text-xs tracking-[0.2em] uppercase">
            Créditos de IA
          </p>
          <button
            type="button"
            popoverTarget={CREDITS_POPOVER_ID}
            popoverTargetAction="hide"
            aria-label="Cerrar"
            className="text-chalk/60 hover:text-chalk hover:bg-chalk/10 -mt-1.5 -mr-1.5 flex size-8 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-3xl leading-none font-black uppercase">
            Lo que usa el bot para atender.
          </h3>
          <p className="text-chalk/70 text-sm text-pretty">
            Cada mensaje que el bot manda por WhatsApp usa un crédito:
            respuestas, recordatorios y confirmaciones. Entender audios y leer
            comprobantes viene incluido. Cada plan trae los suyos, todos los
            meses.
          </p>
        </div>

        <div className="bg-ink flex flex-col gap-2 rounded-2xl p-4">
          <PlayerBubble>¡Hola! ¿Tienen cancha mañana a las 20?</PlayerBubble>
          <PlayerBubble>
            <Mic className="size-4 shrink-0" />
            <Waveform />
            <span className="text-xs tabular-nums opacity-80">0:06</span>
          </PlayerBubble>
          <BotBubble>
            Sí, la Cancha 2 está libre. Para reservarla, transferí la seña de
            $5.000 al alias del club.
          </BotBubble>
          <CreditTag />
          <PlayerBubble>
            <Paperclip className="size-4 shrink-0" />
            comprobante.jpg
          </PlayerBubble>
          <BotBubble>¡Listo, Lucas! Mañana 20:00, Cancha 2. Confirmada ✅</BotBubble>
          <CreditTag />
        </div>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: PlanCell }) {
  if (value === true) {
    return (
      <>
        <CheckDot className="mx-auto size-5 [&_svg]:size-3" />
        <span className="sr-only">Incluido</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus aria-hidden className="text-chalk/25 mx-auto size-4" />
        <span className="sr-only">No incluido</span>
      </>
    );
  }
  return (
    <span className="text-chalk text-xs font-semibold sm:text-sm">{value}</span>
  );
}

const FEATURED_INDEX = PLANS.findIndex((plan) => plan.recommended);

function ComparisonTable() {
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-left">
      <caption className="sr-only">
        Comparación de lo que incluye cada plan de GTP
      </caption>
      <colgroup>
        <col className="w-[40%] sm:w-[46%]" />
        {PLANS.map((plan) => (
          <col key={plan.key} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="bg-ink sticky top-[4.5rem] z-10 py-4">
            <span className="sr-only">Función</span>
          </th>
          {PLANS.map((plan, i) => (
            <th
              key={plan.key}
              scope="col"
              className={cn(
                "bg-ink sticky top-[4.5rem] z-10 px-1 py-4 text-center align-bottom",
                i === FEATURED_INDEX && "bg-court-deep rounded-t-2xl",
              )}
            >
              <span className="font-display block text-base leading-none font-black uppercase sm:text-2xl">
                {plan.name}
              </span>
              <span className="text-chalk/60 mt-1 block font-mono text-[10px] tracking-wide sm:text-xs">
                {formatPrice(plan.priceCents)}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      {COMPARISON.map((group) => (
        <tbody key={group.title}>
          <tr>
            <th
              scope="rowgroup"
              className="text-ball border-chalk/15 border-b pt-8 pb-3 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase"
            >
              {group.title}
            </th>
            {PLANS.map((plan, i) => (
              <td
                key={plan.key}
                aria-hidden
                className={cn(
                  "border-chalk/15 border-b",
                  i === FEATURED_INDEX && "bg-court-deep/60",
                )}
              />
            ))}
          </tr>
          {group.rows.map((row) => (
            <tr key={row.feature}>
              <th
                scope="row"
                className="border-chalk/10 text-chalk/80 border-b py-3.5 pr-3 text-sm font-normal text-pretty sm:text-[15px]"
              >
                {row.feature}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={PLANS[i].key}
                  className={cn(
                    "border-chalk/10 border-b px-1 py-3.5 text-center",
                    i === FEATURED_INDEX && "bg-court-deep/60",
                  )}
                >
                  <CellValue value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}

/**
 * Plans and prices. Three compact cards (courts, AI credits as a bar, staff users, three
 * highlights) under a single line of what every plan includes. The full plan-by-plan table
 * stays folded until asked for, and "¿qué son los créditos?" opens in a popover, so the
 * section reads in about one screen. Prices and limits live in `../lib/plans`.
 */
export function Pricing() {
  const launchDiscount = discountPercent(PLANS[0]);

  return (
    <section
      id="precios"
      className="bg-ink text-chalk relative isolate scroll-mt-20 overflow-clip py-24 lg:py-28"
    >
      <div aria-hidden className="bg-night-dots absolute inset-0 -z-10 opacity-25" />
      <div
        aria-hidden
        className="absolute top-72 left-1/2 -z-10 h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-court)_40%,transparent),transparent)]"
      />

      <Container className="flex flex-col gap-12 lg:gap-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Eyebrow className="text-ball">Planes y precios</Eyebrow>
            <span className="bg-ball text-ink rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] uppercase">
              Lanzamiento · {launchDiscount}% OFF
            </span>
          </div>
          <DisplayTitle className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.88]">
            Probalo un mes, gratis.
          </DisplayTitle>
          <ul className="text-fog flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <CheckDot />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Phones swipe through the cards instead of scrolling past three tall ones. */}
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-4 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>

        <details
          id={COMPARISON_ID}
          className="group scroll-mt-24 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="border-chalk/15 hover:border-chalk/40 focus-visible:ring-ball/50 mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none">
            <span className="group-open:hidden">Comparar todos los planes</span>
            <span className="hidden group-open:inline">Ocultar la comparación</span>
            <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-8">
            <ComparisonTable />
          </div>
        </details>

        <p className="text-fog -mt-4 flex flex-col items-center gap-2 text-center text-sm sm:flex-row sm:justify-center sm:gap-3">
          Precios de lanzamiento en pesos argentinos, por mes.
          <a
            href={lumarsoftWhatsApp("hire")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-chalk decoration-chalk/30 hover:decoration-ball inline-flex items-center gap-1.5 font-medium underline underline-offset-4 transition-colors"
          >
            <WhatsAppIcon className="text-turf size-4" />
            ¿Varias sedes? Escribinos
          </a>
        </p>
      </Container>

      <CreditsPopover />
    </section>
  );
}
