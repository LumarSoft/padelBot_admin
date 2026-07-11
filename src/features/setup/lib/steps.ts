import type { ComponentType } from "react";
import {
  Building2,
  CalendarClock,
  Repeat,
  ShoppingBasket,
  Users,
  Wallet,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import type { SetupStepId } from "@/types/api/onboarding";

export interface SetupStepMeta {
  id: SetupStepId;
  /** Short label for the rail. */
  label: string;
  /** Heading of the step itself. */
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * Tagged "opcional" in the UI: a club can run a normal operation without ever touching it.
   *
   * NOT the same as the API's `required` flag, and they intentionally disagree on
   * `complejo`. `required` (API) means "the bot literally cannot take a booking without
   * this" and gates `status.ready` — only canchas/pagos/whatsapp do. `complejo` doesn't
   * block a booking (a club with no address loaded still books fine, the bot just answers
   * that it doesn't have it), but it's core identity, so we don't invite them to skip it.
   */
  optional: boolean;
}

/**
 * The guided path, in order. Every step can be skipped and every one stays editable from
 * Configuración afterwards — this is a guided route over the panel's existing endpoints,
 * not a gate. The three non-optional steps are the ones the bot literally cannot run
 * without: courts to book, a place to receive the deposit, and a WhatsApp line to answer on.
 */
export const SETUP_STEPS: SetupStepMeta[] = [
  {
    id: "complejo",
    label: "Complejo",
    title: "Contanos del complejo",
    description:
      "El nombre con el que el bot se presenta, cómo llegar y el tono con el que atiende.",
    icon: Building2,
    optional: false,
  },
  {
    id: "canchas",
    label: "Canchas",
    title: "Cargá tus canchas",
    description:
      "Precio, horarios y duración del turno. Es lo que el bot va a ofrecer cuando alguien pregunte.",
    icon: CalendarClock,
    optional: false,
  },
  {
    id: "pagos",
    label: "Cobros",
    title: "Configurá los cobros",
    description:
      "Cuánto pide el bot para confirmar una reserva y a dónde entra esa plata.",
    icon: Wallet,
    optional: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    title: "Conectá el WhatsApp",
    description:
      "El número por el que el bot atiende a tus jugadores. Sin esto, el bot no recibe mensajes.",
    icon: WhatsAppIcon,
    optional: false,
  },
  {
    id: "fijos",
    label: "Turnos fijos",
    title: "Pasá tus turnos fijos",
    description:
      "Los que ya juegan todas las semanas. Cargalos ahora y la agenda arranca con tu realidad, no vacía.",
    icon: Repeat,
    optional: true,
  },
  {
    id: "equipo",
    label: "Equipo",
    title: "Sumá a tu equipo",
    description:
      "Cada empleado con su usuario, para que nadie comparta tu contraseña.",
    icon: Users,
    optional: true,
  },
  {
    id: "kiosco",
    label: "Kiosco",
    title: "Cargá el kiosco",
    description:
      "Pelotas, bebidas y snacks para cobrarlos junto con el turno y que la caja cierre.",
    icon: ShoppingBasket,
    optional: true,
  },
];

export function stepMeta(id: SetupStepId): SetupStepMeta {
  const meta = SETUP_STEPS.find((step) => step.id === id);
  if (!meta) throw new Error(`Unknown setup step: ${id}`);
  return meta;
}

export function stepIndex(id: SetupStepId): number {
  return SETUP_STEPS.findIndex((step) => step.id === id);
}
