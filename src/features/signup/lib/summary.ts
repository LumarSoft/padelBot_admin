import { formatPrice } from "@/lib/format";
import { QUESTIONS, optionsFor, type SignupAnswers } from "@/features/signup/lib/questions";
import { bandsFor, FALLBACK_DURATION } from "@/features/signup/lib/schedule-preview";

export interface SummaryRow {
  /** Question the row jumps back to when they hit "Cambiar". */
  questionId: string;
  label: string;
  /** Null when they skipped it — shown as "Lo charlamos por teléfono". */
  value: string | null;
}

/** The review, grouped the way the conversation went, so it can be scanned in one screen. */
export interface SummaryGroup {
  title: string;
  rows: SummaryRow[];
}

/**
 * The stored value of a choice option → the label they actually tapped. Options are
 * resolved against the answers because some questions reword themselves (a one-court club
 * taps "Techada", not "Todas techadas") — reading back the other wording would be wrong.
 */
function choiceLabel(a: SignupAnswers, questionId: string, value: unknown): string | null {
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question || question.kind !== "choice") return null;
  const option = optionsFor(question, a).find((o) => o.value === value);
  return option?.label ?? null;
}

/**
 * The summary they review before sending, in the same blocks the conversation had. Reads
 * back as sentences, not as a field dump — they should recognize their own answers and
 * spot a mistake at a glance, without scrolling through sixteen identical rows.
 */
export function summaryGroups(a: SignupAnswers): SummaryGroup[] {
  const hours =
    a.openTime && a.closeTime
      ? `${a.openTime} a ${a.closeTime === "00:00" ? "medianoche" : a.closeTime}`
      : null;

  // Say the turnos back to them, since that's what the schedule question actually showed.
  const turnos =
    a.openTime && a.closeTime
      ? bandsFor(a.openTime, a.closeTime, a.slotDurationMinutes ?? FALLBACK_DURATION).length
      : 0;

  // A named window ("los martes a la tarde") is what they'd rather we remembered.
  const contactWindow =
    a.contactWindow === "CUSTOM"
      ? (a.contactWindowNote?.trim() ?? null)
      : choiceLabel(a, "contactWindow", a.contactWindow);

  return [
    {
      title: "Tu complejo",
      rows: [
        {
          questionId: "club",
          label: "Complejo",
          value: [a.clubName, a.city].filter(Boolean).join(" · ") || null,
        },
        { questionId: "owner", label: "Tu nombre", value: a.ownerName ?? null },
      ],
    },
    {
      title: "Tus canchas",
      rows: [
        {
          questionId: "courtCount",
          label: "Canchas",
          value: a.courtCount
            ? `${a.courtCount === 6 ? "6 o más" : a.courtCount} · ${
                choiceLabel(a, "courtType", a.courtType)?.toLowerCase() ?? "sin especificar"
              }`
            : null,
        },
        {
          questionId: "slotDuration",
          label: "Duración del turno",
          value:
            "slotDurationMinutes" in a
              ? choiceLabel(a, "slotDuration", a.slotDurationMinutes ?? null)
              : null,
        },
        {
          questionId: "hours",
          label: "Horario",
          value: hours ? `${hours}${turnos ? ` · ${turnos} turnos por día` : ""}` : null,
        },
        {
          questionId: "avgPrice",
          label: "Precio del turno",
          value: a.avgPriceCents ? formatPrice(a.avgPriceCents) : null,
        },
      ],
    },
    {
      title: "Cobros",
      rows: [
        {
          questionId: "chargesDeposit",
          label: "Seña",
          value: choiceLabel(a, "chargesDeposit", a.chargesDeposit),
        },
        {
          questionId: "hasMercadoPago",
          label: "MercadoPago",
          value: choiceLabel(a, "hasMercadoPago", a.hasMercadoPago),
        },
      ],
    },
    {
      title: "Cómo trabajás hoy",
      rows: [
        {
          questionId: "currentSystem",
          label: "Gestionás con",
          value: choiceLabel(a, "currentSystem", a.currentSystem),
        },
        {
          questionId: "biggestPain",
          label: "Lo que más tiempo lleva",
          value: choiceLabel(a, "biggestPain", a.biggestPain),
        },
        {
          questionId: "fixedSlots",
          label: "Turnos fijos",
          value: choiceLabel(a, "fixedSlots", a.fixedSlots),
        },
        {
          questionId: "howFound",
          label: "Nos conociste por",
          value: choiceLabel(a, "howFound", a.howFound),
        },
      ],
    },
    {
      title: "Contacto",
      rows: [
        {
          questionId: "contact",
          label: "Te escribimos a",
          value: [a.phone, a.email].filter(Boolean).join(" · ") || null,
        },
        { questionId: "contactWindow", label: "Mejor momento", value: contactWindow },
        { questionId: "contact", label: "Nos contaste", value: a.message?.trim() || null },
      ],
    },
  ];
}
