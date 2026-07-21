import { waLink } from "@/lib/whatsapp";

/**
 * Lumarsoft contact details. Used by the onboarding help card and (later) the
 * landing CTAs so the data lives in exactly one place.
 *
 * TODO: replace these placeholders with the real Lumarsoft WhatsApp number and
 * email before going to production.
 */
export const LUMARSOFT = {
  /** WhatsApp number in international format (digits only; "+" is stripped by waLink). */
  whatsapp: "5493416956364",
  email: "lumarsoftarg@gmail.com",
  /** Human-readable number for display. */
  whatsappDisplay: "+54 9 341 695-6364",
} as const;

/** Why an owner is reaching out — shapes the pre-filled WhatsApp message. */
export type ContactIntent = "help" | "demo" | "interested" | "hire" | "whatsapp-setup";

const INTENT_MESSAGE: Record<ContactIntent, string> = {
  help: "Hola Lumarsoft, necesito ayuda configurando mi complejo en PadelBot.",
  demo: "Hola Lumarsoft, quiero una demo de PadelBot para mi complejo de pádel.",
  interested: "Hola Lumarsoft, estoy interesado en PadelBot para mi complejo de pádel.",
  hire: "Hola Lumarsoft, quiero contratar PadelBot para mi complejo.",
  "whatsapp-setup":
    "Hola Lumarsoft, quiero conectar mi línea de WhatsApp a PadelBot.",
};

/** wa.me deep link to Lumarsoft with a message pre-filled for the given intent. */
export function lumarsoftWhatsApp(intent: ContactIntent = "help"): string {
  return waLink(LUMARSOFT.whatsapp, INTENT_MESSAGE[intent]);
}

/** mailto link to Lumarsoft with a subject/body pre-filled for the given intent. */
export function lumarsoftEmail(intent: ContactIntent = "help"): string {
  const subject = "PadelBot — consulta";
  const body = INTENT_MESSAGE[intent];
  return `mailto:${LUMARSOFT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
