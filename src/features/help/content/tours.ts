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
 *
 * Inside a dialog every step needs `waitFor`: tapping "Siguiente" in the bubble counts as a
 * click outside the dialog and closes it.
 */
export interface TourStep {
  target: string;
  text: string;
  waitFor?: string;
  missing?: string;
}

export interface Tour {
  /**
   * Screen the guide runs on, with its query when it matters (`/panel/configuracion?tab=pagos`:
   * each Configuración tab is a `?tab=`). Without it, it runs wherever the user is.
   */
  route?: string;
  steps: [TourStep] | [TourStep, TourStep] | [TourStep, TourStep, TourStep];
}

const NO_OPEN_BILL_TODAY =
  "No hay turnos con la cuenta abierta en este día. Pasá a otro día con la flecha ›.";
const NO_UPCOMING_TODAY =
  "No quedan turnos por jugar en este día. Pasá a otro día con la flecha ›.";
const NO_STAFF = "Todavía no cargaste empleados. Sumalos con «Agregar usuario».";

/** The save button at the bottom of the Configuración forms (it stays off until something changes). */
const SAVE_STEP: TourStep = {
  target: "config-guardar",
  text: "Tocá «Guardar cambios». Hasta que no guardes, no cambia nada.",
};

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

  // ── Owner ─────────────────────────────────────────────────────────────────
  "ajustar-precios": {
    route: "/panel/configuracion?tab=canchas",
    steps: [
      { target: "precios-ajustar", text: "Tocá «Ajustar precios».", waitFor: "precios-ajustar" },
      {
        target: "precios-porcentaje",
        text: "Poné el porcentaje y tocá «Ver cómo queda».",
        waitFor: "precios-ver",
      },
      {
        target: "precios-aplicar",
        text: "Revisá los precios nuevos y tocá «Aplicar a todo».",
        waitFor: "precios-aplicar",
      },
    ],
  },
  "programar-aumento": {
    route: "/panel/configuracion?tab=canchas",
    steps: [
      { target: "precios-ajustar", text: "Tocá «Ajustar precios».", waitFor: "precios-ajustar" },
      {
        target: "precios-fecha",
        text: "Poné el porcentaje y tocá la fecha en «Aplicar desde».",
        waitFor: "precios-fecha",
      },
      {
        target: "precios-aplicar",
        text: "Elegí el día y tocá «Programar para el…».",
        waitFor: "precios-aplicar",
      },
    ],
  },
  "precio-franja": {
    route: "/panel/configuracion?tab=canchas",
    steps: [
      {
        target: "cancha-precios",
        text: "Tocá el $ de la cancha.",
        waitFor: "cancha-precios",
        missing: "Todavía no cargaste canchas. Creá una con «Nueva cancha».",
      },
      {
        target: "franja-agregar",
        text: "Elegí la franja, poné el precio y tocá «Agregar».",
        waitFor: "franja-confirmar",
        missing: "Esta cancha ya tiene precio propio en todas sus franjas.",
      },
    ],
  },
  "modo-cobro": {
    route: "/panel/configuracion?tab=pagos",
    steps: [
      { target: "cobro-modo", text: "Elegí: seña, la cancha completa o sin seña." },
      SAVE_STEP,
    ],
  },
  mercadopago: {
    route: "/panel/configuracion?tab=pagos",
    steps: [
      {
        target: "mp-conectar",
        text: "Tocá «Conectar MercadoPago» y entrá con la cuenta del club.",
      },
    ],
  },
  alias: {
    route: "/panel/configuracion?tab=pagos",
    steps: [
      { target: "transfer-datos", text: "Cambiá el alias y el titular de la cuenta." },
      SAVE_STEP,
    ],
  },
  cancelacion: {
    route: "/panel/configuracion?tab=pagos",
    steps: [
      {
        target: "cobro-cancelacion",
        text: "Poné con cuántas horas de aviso la seña le queda a favor al jugador.",
      },
      SAVE_STEP,
    ],
  },
  "confirmacion-fijos": {
    route: "/panel/configuracion?tab=fijos",
    steps: [
      { target: "fijos-pregunta", text: "Elegí «Sí, que el bot les pregunte» y cuándo." },
      SAVE_STEP,
    ],
  },
  "faq-bot": {
    route: "/panel/configuracion?tab=bot",
    steps: [
      {
        target: "bot-faq",
        text: "Tocá una sugerencia o «Agregar pregunta» y escribí la respuesta.",
      },
      SAVE_STEP,
    ],
  },
  "alta-empleado": {
    route: "/panel/configuracion?tab=equipo",
    steps: [
      { target: "equipo-agregar", text: "Tocá «Agregar usuario».", waitFor: "equipo-agregar" },
      {
        target: "equipo-form",
        text: "Poné su nombre y su email, y tocá «Crear usuario».",
        waitFor: "equipo-crear",
      },
    ],
  },
  "baja-empleado": {
    route: "/panel/configuracion?tab=equipo",
    steps: [
      {
        target: "equipo-desactivar",
        text: "Tocá «Desactivar» en la fila del empleado.",
        missing: NO_STAFF,
      },
    ],
  },
  "empleado-clave": {
    route: "/panel/configuracion?tab=equipo",
    steps: [
      {
        target: "equipo-clave",
        text: "Tocá la llave en la fila del empleado: te da una contraseña nueva.",
        missing: NO_STAFF,
      },
    ],
  },
  "equipo-primer-dia": {
    route: "/panel/configuracion?tab=equipo",
    steps: [
      {
        target: "equipo-primer-dia",
        text: "Acá ves cuánto avanzó cada empleado en «Tu primer día».",
      },
    ],
  },
  "reglas-casa": {
    route: "/panel/configuracion?tab=equipo",
    steps: [
      {
        target: "reglas-casa",
        text: "Tocá «Agregar regla» y escribí la pregunta y la respuesta.",
      },
      SAVE_STEP,
    ],
  },
  "bloquear-jugador": {
    route: "/panel/jugadores",
    steps: [
      {
        target: "jugadores-fila",
        text: "Tocá el jugador.",
        waitFor: "jugadores-fila",
        missing: "Todavía no hay jugadores: se crean solos con cada reserva.",
      },
      {
        target: "jugador-bloquear",
        text: "Tocá «Bloquear jugador».",
        waitFor: "jugador-bloquear",
      },
    ],
  },
  stock: {
    route: "/panel/productos",
    steps: [
      {
        target: "producto-editar",
        text: "Tocá el lápiz del producto.",
        waitFor: "producto-editar",
        missing: "Todavía no cargaste productos. Creá uno con «Nuevo producto».",
      },
      {
        target: "producto-stock",
        text: "Activá «Controlo el stock», poné cuánto hay y el mínimo, y tocá «Guardar».",
        waitFor: "producto-guardar",
      },
    ],
  },
  "kiosco-dueno": {
    route: "/panel/productos",
    steps: [
      {
        target: "kiosco-acciones",
        text: "Venta suelta, mercadería que llegó y conteo de stock: todo arranca acá.",
      },
    ],
  },
  reportes: {
    route: "/panel/reportes",
    steps: [
      {
        target: "reportes-ingresos",
        text: "«Total recaudado» son las señas más el mostrador. «Kiosco» es lo vendido.",
        missing: "No hay ingresos en este período. Elegí otro mes arriba a la derecha.",
      },
      {
        target: "reportes-ocupacion",
        text: "El mapa de calor muestra qué horarios se llenan y cuáles quedan vacíos.",
      },
    ],
  },
} satisfies Record<string, Tour>;

export type TourId = keyof typeof TOURS;

export function getTour(id: TourId): Tour {
  return TOURS[id];
}
