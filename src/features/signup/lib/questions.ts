import type { ComponentType } from "react";
import {
  Banknote,
  Building2,
  CalendarClock,
  Clock3,
  Heart,
  LayoutGrid,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  Repeat,
  Sparkles,
  Sun,
  Timer,
  User,
  Wallet,
} from "lucide-react";

/** Everything the step-by-step signup collects. Mirrors the API's RequestClubDto. */
export interface SignupAnswers {
  clubName?: string;
  city?: string;
  ownerName?: string;

  courtCount?: number;
  courtType?: string;
  slotDurationMinutes?: number;
  openTime?: string;
  closeTime?: string;
  avgPriceCents?: number;

  chargesDeposit?: string;
  hasMercadoPago?: string;

  currentSystem?: string;
  biggestPain?: string;
  fixedSlots?: string;
  howFound?: string;
  contactWindow?: string;
  /** Free text when they picked "un horario puntual" instead of a broad window. */
  contactWindowNote?: string;

  email?: string;
  phone?: string;
  message?: string;
}

export type AnswerKey = keyof SignupAnswers;

export interface ChoiceOption {
  /** Stored value. `null` is a real answer ("depende", "no sé") — not a skip. */
  value: string | number | null;
  label: string;
  hint?: string;
  /** Pill on the card ("Más usado"). Nudges the default without hiding the alternatives. */
  badge?: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface FieldSpec {
  key: AnswerKey;
  label: string;
  placeholder?: string;
  type: "text" | "email" | "tel" | "time" | "number" | "textarea";
  /** Number fields are typed in pesos and stored in cents. */
  cents?: boolean;
  maxLength?: number;
  optional?: boolean;
}

interface BaseQuestion {
  id: string;
  /** Small line above the prompt ("Tus canchas"). */
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  /** The question itself. A function so it can address them by name. */
  prompt: (a: SignupAnswers) => string;
  /** One reassuring line under it — why we're asking, or what happens next. */
  help?: (a: SignupAnswers) => string;
  /** Skippable questions show "Prefiero contarlo después". */
  optional?: boolean;
  /** Act of the flow. Drives the backdrop, which shifts colour as they move through. */
  chapter: ChapterId;
}

/** The acts of the conversation. The room changes as they walk through it. */
export const CHAPTERS = ["complejo", "canchas", "cobros", "contexto", "cierre"] as const;
export type ChapterId = (typeof CHAPTERS)[number];

export interface ChoiceQuestion extends BaseQuestion {
  kind: "choice";
  key: AnswerKey;
  /**
   * A function when the wording depends on what they already told us — a club with one
   * court shouldn't be asked whether "todas" are covered. Resolve with `optionsFor`.
   */
  options: ChoiceOption[] | ((a: SignupAnswers) => ChoiceOption[]);
  /** Wider cards for long labels. */
  columns?: 2 | 3;
  /** Centers the label — short options (a bare number) look lost pinned to the left. */
  centered?: boolean;
  /**
   * An option that opens a field instead of moving on ("un horario puntual" → type it).
   * While it's the selected value the question does NOT auto-advance, because they're
   * still answering it.
   */
  reveal?: { when: string | number | null; field: FieldSpec };
}

/** The options of a choice question, given what's been answered so far. */
export function optionsFor(
  question: ChoiceQuestion,
  answers: SignupAnswers,
): ChoiceOption[] {
  return typeof question.options === "function"
    ? question.options(answers)
    : question.options;
}

export interface FieldsQuestion extends BaseQuestion {
  kind: "fields";
  fields: FieldSpec[];
}

/** Opening hours, drawn as the grid of turnos they produce. See ScheduleField. */
export interface ScheduleQuestion extends BaseQuestion {
  kind: "schedule";
}

export type Question = ChoiceQuestion | FieldsQuestion | ScheduleQuestion;

/** First name only — "Contanos, Juan" reads warmer than the full name. */
export function firstName(a: SignupAnswers): string {
  return a.ownerName?.trim().split(" ")[0] ?? "";
}

function club(a: SignupAnswers): string {
  return a.clubName?.trim() || "tu complejo";
}

/**
 * The questions, in order. Two jobs: pre-load the `/setup` wizard so provisioning is half
 * done before we ever sit with the club, and qualify the lead. Choice questions are one
 * tap and auto-advance — the whole thing has to feel like a conversation, not a form,
 * which is why the prompts address them by name once we know it.
 */
export const QUESTIONS: Question[] = [
  {
    id: "club",
    chapter: "complejo",
    kind: "fields",
    eyebrow: "Tu complejo",
    icon: Building2,
    prompt: () => "¿Cómo se llama tu complejo?",
    help: () => "Con este nombre va a presentarse el bot ante tus jugadores.",
    fields: [
      { key: "clubName", label: "Nombre del complejo", placeholder: "Pádel Center", type: "text", maxLength: 80 },
      { key: "city", label: "Ciudad", placeholder: "Rosario", type: "text", maxLength: 80 },
    ],
  },
  {
    id: "owner",
    chapter: "complejo",
    kind: "fields",
    eyebrow: "Vos",
    icon: User,
    prompt: () => "¿Y vos, cómo te llamás?",
    help: () => "Para saber con quién hablamos cuando te contactemos.",
    fields: [
      { key: "ownerName", label: "Tu nombre", placeholder: "Juan Pérez", type: "text", maxLength: 100 },
    ],
  },
  {
    id: "courtCount",
    chapter: "canchas",
    kind: "choice",
    key: "courtCount",
    eyebrow: "Tus canchas",
    icon: LayoutGrid,
    prompt: (a) => `${firstName(a) ? `Contanos, ${firstName(a)}: ¿c` : "¿C"}uántas canchas tenés?`,
    help: () => "Las dejamos cargadas antes de que empieces.",
    columns: 3,
    centered: true,
    options: [
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
      { value: 4, label: "4" },
      { value: 5, label: "5" },
      { value: 6, label: "6 o más" },
    ],
  },
  {
    id: "courtType",
    chapter: "canchas",
    kind: "choice",
    key: "courtType",
    eyebrow: "Tus canchas",
    icon: Sun,
    // A club with a single court can't have "todas" of anything.
    prompt: (a) =>
      a.courtCount === 1 ? "¿Es techada o al aire libre?" : "¿Son techadas o al aire libre?",
    columns: 3,
    options: (a) =>
      a.courtCount === 1
        ? [
            { value: "INDOOR", label: "Techada" },
            { value: "OUTDOOR", label: "Al aire libre" },
            { value: "MIXED", label: "Es semicubierta" },
          ]
        : [
            { value: "INDOOR", label: "Todas techadas" },
            { value: "OUTDOOR", label: "Todas al aire libre" },
            { value: "MIXED", label: "Hay de las dos" },
          ],
  },
  {
    id: "slotDuration",
    chapter: "canchas",
    kind: "choice",
    key: "slotDurationMinutes",
    eyebrow: "Tus turnos",
    icon: Timer,
    prompt: () => "¿Cuánto dura un turno?",
    columns: 2,
    options: [
      { value: 60, label: "60 minutos" },
      { value: 90, label: "90 minutos", badge: "Más usado" },
      { value: 120, label: "2 horas" },
      { value: null, label: "Depende de la cancha" },
    ],
  },
  {
    id: "hours",
    chapter: "canchas",
    kind: "schedule",
    eyebrow: "Tus horarios",
    icon: Clock3,
    prompt: (a) => `¿En qué horario abre ${club(a)}?`,
    help: () =>
      "Mirá cómo te queda el día armado. Los horarios especiales de cada día los ajustamos después, juntos.",
  },
  {
    id: "avgPrice",
    chapter: "canchas",
    kind: "fields",
    eyebrow: "Tus precios",
    icon: Banknote,
    prompt: () => "¿Cuánto sale un turno?",
    help: () => "Un precio promedio alcanza. Después cargamos los precios por franja horaria.",
    fields: [
      { key: "avgPriceCents", label: "Precio del turno (ARS)", placeholder: "20000", type: "number", cents: true },
    ],
  },
  {
    id: "chargesDeposit",
    chapter: "cobros",
    kind: "choice",
    key: "chargesDeposit",
    eyebrow: "Cobros",
    icon: Wallet,
    prompt: () => "¿Hoy pedís una seña para reservar?",
    help: () => "El bot puede pedirla y confirmar la reserva solo cuando entra la plata.",
    columns: 3,
    options: [
      { value: "ALWAYS", label: "Sí, siempre" },
      { value: "SOMETIMES", label: "A veces" },
      { value: "NEVER", label: "No, pagan al llegar" },
    ],
  },
  {
    id: "hasMercadoPago",
    chapter: "cobros",
    kind: "choice",
    key: "hasMercadoPago",
    eyebrow: "Cobros",
    icon: Sparkles,
    prompt: () => "¿Tenés MercadoPago a nombre del complejo?",
    // Someone who already charges deposits knows exactly why we're asking; someone who
    // doesn't needs to be told this isn't a commitment to start.
    help: (a) =>
      a.chargesDeposit === "NEVER"
        ? "Aunque hoy cobres todo al llegar, te lo preguntamos igual: si algún día querés que el bot pida una seña, sale de ahí. No te obliga a nada."
        : "Es la parte más engorrosa de configurar, así que la hacemos nosotros con vos. Saberlo ahora nos ahorra la mitad de la reunión.",
    columns: 3,
    options: [
      { value: "YES", label: "Sí, tenemos" },
      { value: "NO", label: "No, todavía no" },
      { value: "UNSURE", label: "No estoy seguro" },
    ],
  },
  {
    id: "currentSystem",
    chapter: "contexto",
    kind: "choice",
    key: "currentSystem",
    eyebrow: "Cómo trabajás hoy",
    icon: NotebookPen,
    optional: true,
    prompt: () => "¿Cómo llevás las reservas hoy?",
    help: () => "Sin juzgar: el cuaderno funciona. Nos sirve para saber de dónde partimos.",
    columns: 2,
    options: [
      { value: "PAPER", label: "Cuaderno o papel" },
      { value: "WHATSAPP", label: "WhatsApp, a mano" },
      { value: "SPREADSHEET", label: "Excel o una planilla" },
      { value: "SOFTWARE", label: "Otro sistema" },
    ],
  },
  {
    id: "biggestPain",
    chapter: "contexto",
    kind: "choice",
    key: "biggestPain",
    eyebrow: "Cómo trabajás hoy",
    icon: Heart,
    optional: true,
    // Naming their own system back to them shows we were listening.
    prompt: (a) => {
      const system: Record<string, string> = {
        PAPER: "Con el cuaderno, ¿qué es lo que más tiempo te lleva?",
        WHATSAPP: "Manejando todo por WhatsApp, ¿qué es lo que más tiempo te lleva?",
        SPREADSHEET: "Con la planilla, ¿qué es lo que más tiempo te lleva?",
        SOFTWARE: "Con el sistema que usás hoy, ¿qué es lo que más te cuesta?",
      };
      return system[a.currentSystem ?? ""] ?? "¿Qué es lo que más tiempo te lleva?";
    },
    columns: 2,
    options: [
      { value: "REPLYING", label: "Contestar WhatsApp todo el día" },
      { value: "DEPOSITS", label: "Perseguir las señas" },
      { value: "CHANGES", label: "Los cambios y las cancelaciones" },
      { value: "FIXED_SLOTS", label: "Manejar los turnos fijos" },
      { value: "OTHER", label: "Otra cosa" },
    ],
  },
  {
    id: "fixedSlots",
    chapter: "contexto",
    kind: "choice",
    key: "fixedSlots",
    eyebrow: "Cómo trabajás hoy",
    icon: Repeat,
    optional: true,
    prompt: () => "¿Cuántos turnos fijos semanales tenés?",
    help: () => "Los que juegan siempre el mismo día y hora. Los migramos nosotros.",
    columns: 2,
    options: [
      { value: "NONE", label: "Ninguno" },
      { value: "FEW", label: "Entre 1 y 10" },
      { value: "SOME", label: "Entre 11 y 25" },
      { value: "MANY", label: "Más de 25" },
    ],
  },
  {
    id: "howFound",
    chapter: "cierre",
    kind: "choice",
    key: "howFound",
    eyebrow: "Casi terminamos",
    icon: MessageCircle,
    optional: true,
    prompt: () => "¿Cómo nos conociste?",
    columns: 3,
    options: [
      { value: "INSTAGRAM", label: "Instagram" },
      { value: "REFERRAL", label: "Me recomendaron" },
      { value: "GOOGLE", label: "Google" },
      { value: "OTHER_CLUB", label: "Por otro club" },
      { value: "OTHER", label: "Otro" },
    ],
  },
  {
    id: "contactWindow",
    chapter: "cierre",
    kind: "choice",
    key: "contactWindow",
    eyebrow: "Casi terminamos",
    icon: Phone,
    optional: true,
    prompt: (a) => `¿Cuándo te viene bien que te llamemos${firstName(a) ? `, ${firstName(a)}` : ""}?`,
    help: () => "Te escribimos por WhatsApp primero, así no te interrumpimos.",
    columns: 2,
    options: [
      { value: "MORNING", label: "A la mañana", hint: "9 a 13 h" },
      { value: "AFTERNOON", label: "A la tarde", hint: "13 a 19 h" },
      { value: "EVENING", label: "A la noche", hint: "19 a 22 h" },
      { value: "CUSTOM", label: "Un horario puntual", hint: "Decinos cuál" },
    ],
    // "Cualquier momento" sounded accommodating and told us nothing. A club that only has
    // a free minute at 16:30 los martes can now just say so.
    reveal: {
      when: "CUSTOM",
      field: {
        key: "contactWindowNote",
        label: "¿Cuándo, exactamente?",
        placeholder: "Martes y jueves después de las 16, o los días de semana temprano.",
        type: "text",
        maxLength: 120,
      },
    },
  },
  {
    id: "contact",
    chapter: "cierre",
    kind: "fields",
    eyebrow: "Último paso",
    icon: MapPin,
    prompt: () => "¿Dónde te escribimos?",
    help: () => "Te contactamos a la brevedad. No te vamos a llenar de mails.",
    fields: [
      { key: "phone", label: "WhatsApp", placeholder: "+54 9 341 555-5555", type: "tel", maxLength: 30 },
      { key: "email", label: "Email", placeholder: "vos@tuclub.com", type: "email" },
      {
        key: "message",
        label: "¿Algo más que quieras contarnos? (opcional)",
        placeholder: "Cualquier cosa que nos sirva saber antes de hablar.",
        type: "textarea",
        maxLength: 1000,
        optional: true,
      },
    ],
  },
];

function hasValue(answers: SignupAnswers, key: AnswerKey): boolean {
  const value = answers[key];
  return typeof value === "number" ? Number.isFinite(value) : Boolean(value);
}

/** A question is answered when every non-optional field it owns has a value. */
export function isAnswered(question: Question, answers: SignupAnswers): boolean {
  if (question.kind === "schedule") {
    return hasValue(answers, "openTime") && hasValue(answers, "closeTime");
  }

  if (question.kind === "choice") {
    // `null` is a legitimate answer ("depende"), so check presence, not truthiness.
    if (!(question.key in answers)) return false;
    // An option that opens a field isn't answered until that field is filled.
    const reveal = question.reveal;
    if (reveal && answers[question.key] === reveal.when) {
      return hasValue(answers, reveal.field.key);
    }
    return true;
  }

  return question.fields
    .filter((field) => !field.optional)
    .every((field) => hasValue(answers, field.key));
}

/** Required questions block "Continuar"; optional ones offer to skip. */
export function canAdvance(question: Question, answers: SignupAnswers): boolean {
  return question.optional || isAnswered(question, answers);
}

/** Icons re-exported so the summary can label each answer without duplicating the map. */
export const CALENDAR_ICON = CalendarClock;
