/**
 * "Mostrame": short on-screen guides. Each one goes to its screen, highlights the REAL
 * element and says one line about it — at most three steps.
 *
 * Steps point at `data-help="…"` attributes on the real elements (never at CSS classes, which
 * change with every restyle). When several elements share an anchor (e.g. every free cell of
 * the Agenda), the first visible one is used; one element can carry several anchors separated
 * by spaces. To move a guide to another button, move the attribute.
 *
 *   target   — the element to highlight.
 *   text     — what to do, in one line.
 *   waitFor  — the element whose click moves on (usually the target itself). Without it the
 *              bubble shows "Siguiente" / "Listo".
 *   missing  — what to say when the element isn't on screen (e.g. no pending señas right now).
 */
export interface TourStep {
  target: string;
  text: string;
  waitFor?: string;
  missing?: string;
}

export interface Tour {
  /** Screen the guide runs on. Without it, it runs wherever the user is. */
  route?: string;
  steps: [TourStep] | [TourStep, TourStep] | [TourStep, TourStep, TourStep];
}

const NO_OPEN_BILL_TODAY =
  "No hay turnos con la cuenta abierta en este día. Pasá a otro día con la flecha ›.";
const NO_UPCOMING_TODAY =
  "No quedan turnos por jugar en este día. Pasá a otro día con la flecha ›.";

export const TOURS = {
  "anotar-turno": {
    route: "/panel/agenda",
    steps: [
      {
        target: "agenda-libre",
        text: "Tocá un turno libre de la grilla (los verdes).",
        waitFor: "agenda-libre",
        missing: "Hoy no quedan turnos libres. Pasá a otro día con la flecha ›.",
      },
      {
        target: "reserva-form",
        text: "Escribí el nombre del jugador y tocá «Reservar».",
        waitFor: "reserva-confirmar",
      },
    ],
  },
  "ver-hoy": {
    route: "/panel/agenda",
    steps: [
      { target: "agenda-hoy", text: "«Hoy» te trae siempre al día de hoy." },
      {
        target: "agenda-grilla",
        text: "Cada columna es una cancha. Azul: reservado. Verde: libre. «Fijo»: turno fijo.",
      },
      { target: "agenda-lista", text: "En «Lista» ves todas las reservas, una abajo de la otra." },
    ],
  },
  consumo: {
    route: "/panel/agenda",
    steps: [
      {
        target: "agenda-por-cobrar",
        text: "Tocá el turno del jugador.",
        waitFor: "agenda-por-cobrar",
        missing: NO_OPEN_BILL_TODAY,
      },
      { target: "turno-cuenta", text: "Tocá «Cuenta del turno».", waitFor: "turno-cuenta" },
      {
        target: "cuenta-consumo",
        text: "Elegí lo que tomó y tocá «Guardar y cerrar».",
        waitFor: "cuenta-guardar",
      },
    ],
  },
  cobro: {
    route: "/panel/agenda",
    steps: [
      {
        target: "agenda-por-cobrar",
        text: "Tocá el turno que vas a cobrar.",
        waitFor: "agenda-por-cobrar",
        missing: NO_OPEN_BILL_TODAY,
      },
      { target: "turno-cuenta", text: "Tocá «Cuenta del turno».", waitFor: "turno-cuenta" },
      {
        target: "cuenta-cobros",
        text: "Tocá Efectivo, QR o Transf. al lado de quien te paga.",
        waitFor: "cuenta-cobrar",
        missing: "Este turno ya está pago: no debe nadie.",
      },
    ],
  },
  sena: {
    route: "/panel/pagos",
    steps: [
      { target: "pagos-pendientes", text: "Acá están las señas que faltan confirmar." },
      {
        target: "pago-confirmar",
        text: "Si la plata entró, tocá «Confirmar reserva».",
        waitFor: "pago-confirmar",
        missing: "Ahora no hay señas pendientes. Cuando haya, aparecen acá.",
      },
    ],
  },
  mover: {
    route: "/panel/agenda",
    steps: [
      {
        target: "agenda-reservado",
        text: "Tocá el turno que hay que mover.",
        waitFor: "agenda-reservado",
        missing: NO_UPCOMING_TODAY,
      },
      { target: "turno-reprogramar", text: "Tocá «Reprogramar».", waitFor: "turno-reprogramar" },
      {
        target: "reprogramar-turno",
        text: "Elegí el día y la hora nueva, y tocá «Reprogramar».",
        waitFor: "reprogramar-confirmar",
      },
    ],
  },
  cancelar: {
    route: "/panel/agenda",
    steps: [
      {
        target: "agenda-reservado",
        text: "Tocá el turno que se cancela.",
        waitFor: "agenda-reservado",
        missing: NO_UPCOMING_TODAY,
      },
      { target: "turno-cancelar", text: "Tocá «Cancelar» y confirmá.", waitFor: "turno-cancelar" },
    ],
  },
  bloquear: {
    route: "/panel/agenda",
    steps: [
      { target: "agenda-bloquear", text: "Tocá «Bloquear turnos».", waitFor: "agenda-bloquear" },
      { target: "agenda-grilla", text: "Marcá los turnos a cerrar y confirmá abajo." },
    ],
  },
  chat: {
    route: "/panel/conversaciones",
    steps: [
      {
        target: "chats-item",
        text: "Tocá la conversación que dice «Pide asesor».",
        waitFor: "chats-item",
        missing: "No hay conversaciones todavía.",
      },
      {
        target: "chat-modo",
        text: "Pasá a «Humano» y escribile. Al terminar, volvé a «IA».",
      },
    ],
  },
  buscar: {
    steps: [
      {
        target: "buscar-jugador",
        text: "Escribí el nombre o el teléfono y tocá el resultado.",
        missing: "En el celu no está el buscador: usá Agenda → «Lista».",
      },
    ],
  },
  "cambiar-clave": {
    steps: [{ target: "cambiar-clave", text: "Tocá la llave para cambiar tu contraseña." }],
  },
} satisfies Record<string, Tour>;

export type TourId = keyof typeof TOURS;

export function getTour(id: TourId): Tour {
  return TOURS[id];
}
