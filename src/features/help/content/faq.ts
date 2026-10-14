import type { TourId } from "@/features/help/content/tours";

/**
 * The desk questions of the "?" help. Plain data, meant to be edited by hand.
 *
 * Rules of thumb (the reader is a receptionist on her first week who doesn't read):
 *   - The question in her words, mostly "qué hago si…".
 *   - At most three short lines of answer (the type won't take a fourth), in rioplatense.
 *   - Name buttons exactly as they read on screen, between «».
 *   - `keywords`: other ways people search for it ("transfirio", "plata", "gatorade"). Accents
 *     and case don't matter.
 *   - `tour`: the "Mostrame" guide (content/tours.ts) when the answer happens on a screen.
 *
 * What the built-in help can't answer shows up in the ops console (searches with no result).
 */
export interface HelpEntry {
  id: string;
  question: string;
  answer: [string] | [string, string] | [string, string, string];
  keywords?: string[];
  tour?: TourId;
}

export const HELP_ENTRIES: HelpEntry[] = [
  {
    id: "anotar-turno",
    question: "¿Cómo anoto un turno?",
    answer: [
      "En la Agenda, tocá un turno libre (los verdes).",
      "Poné el nombre y, si lo tenés, el teléfono.",
      "Tocá «Reservar» y listo.",
    ],
    keywords: ["reservar", "reserva", "agendar", "nuevo turno", "llamo", "llamaron", "telefono", "cargar turno"],
    tour: "anotar-turno",
  },
  {
    id: "sin-turno",
    question: "Llegó alguien sin turno, ¿qué hago?",
    answer: [
      "Fijate en la Agenda si hay una cancha libre ahora.",
      "Si hay, tocala, poné su nombre y «Reservar».",
      "Al final le cobrás desde «Cuenta del turno».",
    ],
    keywords: ["sin reserva", "de pasada", "caminando", "libre ahora", "quiere jugar", "llego"],
    tour: "anotar-turno",
  },
  {
    id: "turnos-hoy",
    question: "¿Dónde veo quién juega hoy?",
    answer: [
      "La Agenda abre siempre en el día de hoy.",
      "Cada columna es una cancha: azul es reservado y verde, libre.",
    ],
    keywords: ["hoy", "quien viene", "quien juega", "grilla", "calendario", "dia", "agenda"],
    tour: "ver-hoy",
  },
  {
    id: "fijos-hoy",
    question: "¿Cuáles son los fijos de hoy?",
    answer: [
      "En la Agenda, los turnos fijos tienen la etiqueta «Fijo».",
      "Se cargan solos todas las semanas: no los anotes a mano.",
    ],
    keywords: ["fijo", "fijos", "semanal", "todas las semanas", "abono", "siempre juegan"],
    tour: "ver-hoy",
  },
  {
    id: "fijo-no-viene",
    question: "Un fijo avisó que no viene, ¿qué hago?",
    answer: [
      "Tocá su turno en la Agenda y después «Cancelar».",
      "Se libera solo ese día: las otras semanas sigue igual.",
    ],
    keywords: ["fijo", "no puede", "falta", "aviso", "suspende", "no viene", "esta semana no"],
    tour: "cancelar",
  },
  {
    id: "no-vino",
    question: "Un jugador no vino y no avisó",
    answer: [
      "En la Agenda, pestaña «Lista», buscá ese turno (ya pasado).",
      "Tocá «Ausente»: queda anotado en su ficha de Jugadores.",
    ],
    keywords: ["ausente", "falto", "no se presento", "planto", "no show", "colgo", "no aparecio"],
  },
  {
    id: "transferencia-no-aparece",
    question: "El jugador dice que transfirió y no aparece",
    answer: [
      "Pedile el comprobante por WhatsApp.",
      "Si la plata entró, en Pagos tocá «Confirmar reserva».",
      "Si no ves la plata, no confirmes: avisale al dueño.",
    ],
    keywords: [
      "transferi",
      "transfirio",
      "transferencia",
      "ya pague",
      "pague",
      "comprobante",
      "no figura",
      "no llega",
      "no aparece",
      "mercadopago",
      "alias",
    ],
    tour: "sena",
  },
  {
    id: "efectivo",
    question: "Pagó en efectivo, ¿dónde lo anoto?",
    answer: ["Tocá el turno y después «Cuenta del turno».", "Al lado de quien paga, tocá «Efectivo»."],
    keywords: ["efectivo", "cash", "billete", "plata", "cobrar", "cobro", "pago", "caja"],
    tour: "cobro",
  },
  {
    id: "qr-mostrador",
    question: "Me pagó con QR o transferencia en el mostrador",
    answer: ["Igual que el efectivo: «Cuenta del turno».", "Tocá «QR» o «Transf.» al lado de quien paga."],
    keywords: ["qr", "mercado pago", "transferencia", "posnet", "tarjeta", "debito", "cobrar", "cobro"],
    tour: "cobro",
  },
  {
    id: "cerrar-cuenta",
    question: "¿Cómo le cobro el turno a los cuatro?",
    answer: [
      "Tocá el turno → «Cuenta del turno»: ahí ves cuánto debe cada uno.",
      "Cobrale a cada jugador con Efectivo, QR o Transf.",
      "Cuando no debe nadie, el turno queda en verde: «Finalizado».",
    ],
    keywords: ["cuenta", "cerrar", "cuanto debe", "saldo", "resto", "finalizado", "cobrar", "cobro", "pagar"],
    tour: "cobro",
  },
  {
    id: "dividir-cuenta",
    question: "¿Cómo divido la cuenta entre los jugadores?",
    answer: [
      "La cancha se divide sola entre los cuatro.",
      "En cada consumo, marcá con J1 a J4 quién lo paga.",
    ],
    keywords: ["dividir", "partir", "entre cuatro", "cada uno", "separado", "jugadores", "j1"],
    tour: "consumo",
  },
  {
    id: "consumo",
    question: "¿Cómo cargo una bebida a un turno?",
    answer: [
      "Tocá el turno y después «Cuenta del turno».",
      "En «＋ Agregar consumo» elegí la bebida.",
      "Tocá «Guardar y cerrar».",
    ],
    keywords: [
      "bebida",
      "agua",
      "gatorade",
      "gaseosa",
      "cerveza",
      "pelotas",
      "tubo",
      "grip",
      "kiosco",
      "consumo",
      "buffet",
      "cargar",
    ],
    tour: "consumo",
  },
  {
    id: "venta-suelta",
    question: "Alguien compra algo sin jugar",
    answer: ["Entrá a «Kiosco» y tocá «Venta suelta».", "Elegí lo que lleva y cómo pagó."],
    keywords: ["venta", "suelta", "sin turno", "compra", "bebida", "kiosco", "vender"],
  },
  {
    id: "entro-mercaderia",
    question: "Llegó mercadería, ¿dónde la cargo?",
    answer: ["Entrá a «Kiosco» y tocá «Entró mercadería».", "Poné cuántas unidades llegaron de cada cosa."],
    keywords: ["mercaderia", "proveedor", "llego", "stock", "reponer", "cajon", "pedido"],
  },
  {
    id: "deshacer-cobro",
    question: "Me equivoqué al cobrar, ¿cómo lo deshago?",
    answer: ["Abrí la «Cuenta del turno».", "Tocá la × al lado del pago equivocado y cargalo de nuevo."],
    keywords: ["error", "equivoque", "borrar", "deshacer", "mal cobrado", "anular pago"],
  },
  {
    id: "mover",
    question: "Me piden cambiar el horario de un turno",
    answer: [
      "Tocá el turno y después «Reprogramar».",
      "Elegí el día y la hora nueva, y confirmá.",
      "Si había pagado seña, la seña viaja con el turno.",
    ],
    keywords: ["mover", "cambiar", "horario", "otro dia", "pasar", "reprogramar", "correr", "otra hora"],
    tour: "mover",
  },
  {
    id: "cancelar",
    question: "¿Cómo cancelo un turno?",
    answer: [
      "Tocá el turno → «Cancelar» y confirmá.",
      "Si había seña y avisó con tiempo, le queda como crédito.",
    ],
    keywords: ["cancelar", "anular", "borrar turno", "baja", "no viene", "suspender"],
    tour: "cancelar",
  },
  {
    id: "confirmar-sena",
    question: "¿Cómo confirmo una seña?",
    answer: [
      "Entrá a Pagos: arriba están las que faltan confirmar.",
      "Si la plata entró, tocá «Confirmar reserva».",
    ],
    keywords: ["sena", "deposito", "confirmar", "pendiente", "pago", "adelanto"],
    tour: "sena",
  },
  {
    id: "esperando-pago",
    question: "¿Qué significa «Esperando pago»?",
    answer: [
      "El bot reservó y el jugador todavía no mandó la seña.",
      "Si no paga a tiempo, el turno se libera solo.",
    ],
    keywords: ["amarillo", "esperando", "pendiente", "reloj", "vence", "sin pagar"],
  },
  {
    id: "revisar-pago",
    question: "Un turno dice «Revisar pago», ¿qué hago?",
    answer: [
      "El jugador mandó el comprobante: miralo en Pagos.",
      "Si la plata entró, «Confirmar reserva». Si no, «Rechazar».",
    ],
    keywords: ["comprobante", "revisar", "foto", "captura", "verde", "por revisar"],
    tour: "sena",
  },
  {
    id: "comprobante-falso",
    question: "El comprobante no es real o la plata no llegó",
    answer: ["En Pagos, tocá «Rechazar» en esa reserva.", "El turno se libera para otro jugador."],
    keywords: ["falso", "trucho", "mentira", "rechazar", "no llego", "estafa"],
  },
  {
    id: "lluvia",
    question: "Llueve o hay que cerrar canchas",
    answer: [
      "En la Agenda, tocá «Bloquear turnos».",
      "Marcá los turnos a cerrar y confirmá abajo.",
      "Los que ya tenían reserva, cancelalos aparte.",
    ],
    keywords: ["lluvia", "llueve", "cerrar", "bloquear", "torneo", "mantenimiento", "clase", "cerrado"],
    tour: "bloquear",
  },
  {
    id: "liberado",
    question: "¿Qué es un turno «Liberado»?",
    answer: [
      "Se canceló una reserva y el horario quedó libre.",
      "Ya lo podés volver a vender: tocalo y anotá a otro.",
    ],
    keywords: ["liberado", "cancelado", "libre", "se cayo"],
    tour: "anotar-turno",
  },
  {
    id: "pide-persona",
    question: "Un jugador pide hablar con una persona",
    answer: [
      "En Conversaciones, abrí la que dice «Pide asesor».",
      "Pasá a «Humano» y escribile: el bot no se mete.",
      "Cuando termines, volvé a «IA».",
    ],
    keywords: ["asesor", "humano", "persona", "whatsapp", "chat", "mensaje", "atender", "responder"],
    tour: "chat",
  },
  {
    id: "bot-respondio-mal",
    question: "El bot respondió algo mal",
    answer: [
      "Abrí la conversación, pasá a «Humano» y corregilo vos.",
      "Avisale al dueño para que ajuste lo que sabe el bot.",
    ],
    keywords: ["bot", "error", "mal", "respuesta", "ia", "equivoco", "invento"],
    tour: "chat",
  },
  {
    id: "buscar-jugador",
    question: "¿Cómo encuentro el turno de un jugador?",
    answer: [
      "Arriba, en «Buscar jugador o teléfono…», escribí el nombre.",
      "Tocá el resultado y te lleva a ese día de la Agenda.",
    ],
    keywords: ["buscar", "encontrar", "cuando juega", "nombre", "telefono", "jugador"],
    tour: "buscar",
  },
  {
    id: "cambiar-clave",
    question: "¿Cómo cambio mi contraseña?",
    answer: ["Arriba a la derecha, tocá la llave.", "Si te la olvidaste, pedile al dueño una nueva."],
    keywords: ["contrasena", "clave", "password", "olvide", "entrar", "usuario"],
    tour: "cambiar-clave",
  },
];
