import type { TourId } from "@/features/help/content/tours";

/**
 * The questions of the "?" help. Plain data, meant to be edited by hand.
 *
 * Rules of thumb (the reader is a receptionist on her first week who doesn't read, or an owner
 * between two other things):
 *   - The question in their words, mostly "qué hago si…" / "¿cómo…?".
 *   - At most three short lines of answer (the type won't take a fourth), in rioplatense.
 *   - Name buttons exactly as they read on screen, between «». Check them against the code:
 *     never describe a screen or a flow that doesn't exist.
 *   - `keywords`: other ways people search for it ("transfirio", "plata", "gatorade"). Accents
 *     and case don't matter.
 *   - `tour`: the "Mostrame" guide (content/tours.ts) when the answer happens on a screen.
 *   - `audience`: who sees it.
 *       "all"   — everyone. The owner finds these under «Recepción», below their own.
 *       "staff" — only the employees: worded for them ("avisale al dueño"). Give the owner
 *                 their own version when the topic matters to them too.
 *       "owner" — only the owner, first, under «Para el dueño». The staff never sees them.
 *   - The status explanations ("¿por qué dice «Esperando pago»?") are entries too, linked
 *     from the screens with <StatusWhy entry="…" />: line one says why, line two what to do.
 *
 * What the built-in help can't answer shows up in the ops console (searches with no result).
 */
export type HelpAudience = "staff" | "owner" | "all";

export interface HelpEntry {
  id: string;
  audience: HelpAudience;
  question: string;
  answer: readonly [string] | readonly [string, string] | readonly [string, string, string];
  keywords?: readonly string[];
  tour?: TourId;
}

export const HELP_ENTRIES = [
  {
    id: "anotar-turno",
    audience: "all",
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
    audience: "all",
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
    audience: "all",
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
    audience: "all",
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
    audience: "all",
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
    audience: "all",
    question: "Un jugador no vino y no avisó",
    answer: [
      "En la Agenda, pestaña «Lista», buscá ese turno (ya pasado).",
      "Tocá «Ausente»: queda anotado en su ficha de Jugadores.",
    ],
    keywords: ["ausente", "falto", "no se presento", "planto", "no show", "colgo", "no aparecio"],
  },
  {
    id: "transferencia-no-aparece",
    audience: "staff",
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
    audience: "all",
    question: "Pagó en efectivo, ¿dónde lo anoto?",
    answer: ["Tocá el turno y después «Cuenta del turno».", "Al lado de quien paga, tocá «Efectivo»."],
    keywords: ["efectivo", "cash", "billete", "plata", "cobrar", "cobro", "pago", "caja"],
    tour: "cobro",
  },
  {
    id: "qr-mostrador",
    audience: "all",
    question: "Me pagó con QR o transferencia en el mostrador",
    answer: ["Igual que el efectivo: «Cuenta del turno».", "Tocá «QR» o «Transf.» al lado de quien paga."],
    keywords: ["qr", "mercado pago", "transferencia", "posnet", "tarjeta", "debito", "cobrar", "cobro"],
    tour: "cobro",
  },
  {
    id: "cerrar-cuenta",
    audience: "all",
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
    audience: "all",
    question: "¿Cómo divido la cuenta entre los jugadores?",
    answer: [
      "La cancha se divide sola entre los cuatro.",
      "En cada consumo, marcá con J1 a J4 quién lo paga.",
      "Si vas a escanear lo de uno solo, tocá antes su J en «Cargar a».",
    ],
    keywords: ["dividir", "partir", "entre cuatro", "cada uno", "separado", "jugadores", "j1"],
    tour: "consumo",
  },
  {
    id: "consumo",
    audience: "all",
    question: "¿Cómo cargo una bebida a un turno?",
    answer: [
      "Tocá el turno y después «Cuenta del turno».",
      "Escaneala con el lector, o elegila en «＋ Agregar consumo del catálogo».",
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
      "lector",
      "escanear",
      "codigo de barras",
    ],
    tour: "consumo",
  },
  {
    id: "venta-suelta",
    audience: "staff",
    question: "Alguien compra algo sin jugar",
    answer: [
      "Entrá a «Kiosco» y tocá «Cobrar».",
      "Escaneá lo que lleva (o tocalo en la lista).",
      "Elegí cómo paga y tocá «Cobrar». El stock baja solo.",
    ],
    keywords: ["venta", "suelta", "sin turno", "compra", "bebida", "kiosco", "vender", "cobrar", "mostrador", "caja"],
    tour: "mostrador",
  },
  {
    id: "entro-mercaderia",
    audience: "staff",
    question: "Llegó mercadería, ¿dónde la cargo?",
    answer: [
      "Entrá a «Kiosco» y tocá «Cargar stock».",
      "Escaneá cada producto. Si es una caja, escaneá uno y escribí cuántos son.",
      "Tocá «Sumar al stock».",
    ],
    keywords: ["mercaderia", "proveedor", "llego", "stock", "reponer", "cajon", "pedido", "entrada"],
    tour: "cargar-stock",
  },
  {
    id: "lector",
    audience: "all",
    question: "¿Cómo uso el lector de código de barras?",
    answer: [
      "Enchufalo a la compu: anda como un teclado, no hay que configurar nada.",
      "En «Mostrador» o en la «Cuenta del turno», cada código que escaneás suma uno.",
      "Si un código no está cargado, te pregunta qué producto es y lo guarda.",
    ],
    keywords: ["lector", "codigo de barras", "escaner", "scanner", "pistola", "escanear", "barras", "no lo reconoce"],
  },
  {
    id: "atajos-mostrador",
    audience: "all",
    question: "¿Hay atajos de teclado para cobrar más rápido?",
    answer: [
      "En «Mostrador»: F1 Efectivo, F2 QR, F3 Transferencia y F4 cobra (o «Sumar al stock»).",
      "F8 pasa a «Cobrar» y F9 a «Cargar stock». Cada botón muestra su tecla.",
      "En una Mac, apretalas junto con fn.",
    ],
    keywords: ["atajos", "teclas", "teclado", "f1", "f4", "rapido", "shortcut", "cobrar", "efectivo", "qr"],
    tour: "mostrador",
  },
  {
    id: "sonido-lector",
    audience: "all",
    question: "¿Qué significan los sonidos al escanear?",
    answer: [
      "Bip agudo: lo sumó. Dos pitidos: el código no está cargado. Zumbido grave: no sumó nada.",
      "Al cobrar o cargar el stock suena un «listo».",
      "Para silenciarlo, tocá «Sonido» en «Mostrador»: queda así en esa compu.",
    ],
    keywords: ["sonido", "ruido", "bip", "pitido", "suena", "silenciar", "silencio", "volumen", "mute"],
  },
  {
    id: "deshacer-cobro",
    audience: "all",
    question: "Me equivoqué al cobrar, ¿cómo lo deshago?",
    answer: ["Abrí la «Cuenta del turno».", "Tocá la × al lado del pago equivocado y cargalo de nuevo."],
    keywords: ["error", "equivoque", "borrar", "deshacer", "mal cobrado", "anular pago"],
  },
  {
    id: "mover",
    audience: "all",
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
    audience: "all",
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
    audience: "all",
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
    audience: "all",
    question: "¿Qué significa «Esperando pago»?",
    answer: [
      "El bot reservó y el jugador todavía no mandó la seña.",
      "Si no paga a tiempo, el turno se libera solo.",
    ],
    keywords: ["amarillo", "esperando", "pendiente", "reloj", "vence", "sin pagar"],
  },
  {
    id: "revisar-pago",
    audience: "all",
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
    audience: "all",
    question: "El comprobante no es real o la plata no llegó",
    answer: ["En Pagos, tocá «Rechazar» en esa reserva.", "El turno se libera para otro jugador."],
    keywords: ["falso", "trucho", "mentira", "rechazar", "no llego", "estafa"],
  },
  {
    id: "lluvia",
    audience: "all",
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
    audience: "all",
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
    audience: "all",
    question: "Un jugador pide hablar con una persona",
    answer: [
      "En WhatsApp (en el menú), abrí el chat que dice «Pide asesor».",
      "Pasá a «Humano» y escribile: el bot no se mete.",
      "Cuando termines, volvé a «IA».",
    ],
    keywords: ["asesor", "humano", "persona", "whatsapp", "chat", "mensaje", "atender", "responder"],
    tour: "chat",
  },
  {
    id: "bot-respondio-mal",
    audience: "staff",
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
    audience: "all",
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
    audience: "staff",
    question: "¿Cómo cambio mi contraseña?",
    answer: ["Arriba a la derecha, tocá la llave.", "Si te la olvidaste, pedile al dueño una nueva."],
    keywords: ["contrasena", "clave", "password", "olvide", "entrar", "usuario"],
    tour: "cambiar-clave",
  },

  // ── States: why a turno, a payment or a player shows a label (linked by <StatusWhy />) ──
  {
    id: "fijo-no-viene-estado",
    audience: "all",
    question: "¿Qué significa «Fijo no viene»?",
    answer: [
      "El fijo avisó que no viene (por WhatsApp o por teléfono): se liberó solo esa fecha.",
      "Ya se lo podés dar a otro. Las próximas semanas su fijo sigue igual.",
    ],
    keywords: ["fijo no viene", "no puedo", "libero", "liberado", "fijo"],
    tour: "anotar-turno",
  },
  {
    id: "fijo-sin-respuesta",
    audience: "all",
    question: "¿Qué significa «Sin resp.» en un fijo?",
    answer: [
      "El bot le preguntó por WhatsApp si viene y todavía no contestó: el turno sigue reservado.",
      "Llamalo y marcá «Viene» o «No viene» en su turno.",
    ],
    keywords: ["sin respuesta", "sin resp", "no contesto", "fijo", "llamar", "fijos sin respuesta"],
  },
  {
    id: "turno-bloqueado",
    audience: "all",
    question: "¿Qué es un turno «Bloqueado»?",
    answer: [
      "Alguien del club lo cerró: nadie lo puede reservar, ni el bot.",
      "Para abrirlo, tocalo y después «Liberar turno».",
    ],
    keywords: ["bloqueado", "cerrado", "candado", "no se puede reservar", "desbloquear"],
  },
  {
    id: "esperando-comprobante",
    audience: "all",
    question: "¿Qué significa «Esperando comprobante»?",
    answer: [
      "El bot le pidió la foto de la transferencia y el jugador todavía no la mandó.",
      "Hasta que llegue no se puede confirmar. Si no paga a tiempo, el turno se libera solo.",
    ],
    keywords: ["comprobante", "esperando", "foto", "captura", "no mando"],
  },
  {
    id: "sena-total",
    audience: "all",
    question: "¿Por qué el bot le pide la cancha completa a un jugador?",
    answer: [
      "Tiene 3 ausencias o más: el bot le pide el turno entero por adelantado.",
      "Si el club no cobra seña, no lo anota: le pasa el pedido al club para que decida.",
      "Desde el mostrador lo podés anotar igual.",
    ],
    keywords: ["sena total", "cancha completa", "ausencias", "falto", "precio total", "no show", "faltas"],
  },
  {
    id: "jugador-bloqueado",
    audience: "all",
    question: "¿Qué significa «Bloqueado» en un jugador?",
    answer: [
      "El club lo bloqueó: el bot no le toma reservas a ese número.",
      "Desde el mostrador se lo puede anotar igual.",
    ],
    keywords: ["bloqueado", "jugador", "no puede reservar", "bot no lo deja"],
  },

  // ── Owner ─────────────────────────────────────────────────────────────────
  {
    id: "subir-precios",
    audience: "owner",
    question: "¿Cómo subo los precios de las canchas?",
    answer: [
      "En Configuración → Canchas, tocá «Ajustar precios» y poné el porcentaje.",
      "Tocá «Ver cómo queda» y después «Aplicar a todo».",
      "Suben también los precios por franja y los fijos. Lo que ya está pago no cambia.",
    ],
    keywords: ["aumento", "aumentar", "subir", "precio", "tarifa", "inflacion", "porcentaje", "actualizar", "cobrar mas"],
    tour: "ajustar-precios",
  },
  {
    id: "programar-aumento",
    audience: "owner",
    question: "Quiero programar un aumento para más adelante",
    answer: [
      "En «Ajustar precios», poné el porcentaje y una fecha en «Aplicar desde».",
      "Tocá «Programar para el…»: los precios cambian solos esa madrugada.",
      "Para borrarlo, tocá la × en «Aumentos programados».",
    ],
    keywords: ["programar", "aumento", "fecha", "mes que viene", "primero de mes", "desde", "proximo mes"],
    tour: "programar-aumento",
  },
  {
    id: "precio-franja",
    audience: "owner",
    question: "¿Cómo cobro distinto según el horario?",
    answer: [
      "En Configuración → Canchas, tocá el $ de la cancha.",
      "Elegí la franja, poné el precio y tocá «Agregar».",
      "Va cancha por cancha y vale todos los días. El resto usa el precio de la cancha.",
    ],
    keywords: ["franja", "horario", "noche", "pico", "mas caro", "mas barato", "precio por hora", "tarde", "manana"],
    tour: "precio-franja",
  },
  {
    id: "cambiar-sena",
    audience: "owner",
    question: "¿Cómo cambio la seña que pide el bot?",
    answer: [
      "En Configuración → Pagos, en «Qué cobra el bot para confirmar».",
      "Elegí «Seña» y el porcentaje, o «La cancha completa».",
      "Tocá «Guardar cambios». Vale para las reservas nuevas.",
    ],
    keywords: ["sena", "porcentaje", "deposito", "adelanto", "cuanto cobra", "cancha completa"],
    tour: "modo-cobro",
  },
  {
    id: "sin-sena",
    audience: "owner",
    question: "Quiero que el bot reserve sin pedir seña",
    answer: [
      "En Configuración → Pagos, elegí «Sin seña: el bot reserva y confirma directo».",
      "Tocá «Guardar cambios»: el turno queda confirmado y se cobra todo en el club.",
      "A un jugador con 3 ausencias o más no lo anota: te pasa el pedido a vos.",
    ],
    keywords: ["sin sena", "sin deposito", "no cobrar", "anotar directo", "confirmar directo", "sin pago", "libreta"],
    tour: "modo-cobro",
  },
  {
    id: "mercadopago",
    audience: "owner",
    question: "¿Cómo conecto MercadoPago?",
    answer: [
      "En Configuración → Pagos, tocá «Conectar MercadoPago».",
      "Entrá con la cuenta del club y aceptá: volvés solo al panel.",
      "Con «Automático con MercadoPago», el bot confirma solo cada seña que entra.",
    ],
    keywords: ["mercadopago", "mercado pago", "mp", "conectar", "vincular", "automatico", "acreditar"],
    tour: "mercadopago",
  },
  {
    id: "alias",
    audience: "owner",
    question: "¿Dónde cambio el alias para las transferencias?",
    answer: [
      "En Configuración → Pagos, en «Datos de la transferencia».",
      "Cambiá el alias y el titular, y tocá «Guardar cambios».",
      "Es lo que el bot le pasa al jugador para que transfiera.",
    ],
    keywords: ["alias", "cvu", "cbu", "cuenta", "titular", "transferir", "banco", "datos"],
    tour: "alias",
  },
  {
    id: "cancelacion",
    audience: "owner",
    question: "¿Qué pasa con la seña si cancelan?",
    answer: [
      "Lo decidís en Configuración → Pagos, «Política de cancelación»: las horas de aviso.",
      "Con ese aviso o más, la seña le queda al jugador como crédito; con menos, se pierde.",
      "Con 0 horas, siempre le queda a favor.",
    ],
    keywords: ["cancelacion", "cancelar", "devolver", "devolucion", "credito", "a favor", "pierde", "reembolso"],
    tour: "cancelacion",
  },
  {
    id: "confirmacion-fijos",
    audience: "owner",
    question: "¿Cómo hago que el bot les pregunte a los fijos si vienen?",
    answer: [
      "En Configuración → Turnos fijos, elegí «Sí, que el bot les pregunte» y cuándo.",
      "Tocá «Guardar cambios». Si contestan «No puedo», se libera solo esa fecha.",
      "Antes, consultanos si tu número de WhatsApp ya tiene el mensaje aprobado.",
    ],
    keywords: ["fijos", "confirmar", "confirmacion", "vienen", "asistencia", "whatsapp", "preguntar", "llamar"],
    tour: "confirmacion-fijos",
  },
  {
    id: "faq-bot",
    audience: "owner",
    question: "¿Cómo le enseño al bot lo que preguntan siempre?",
    answer: [
      "En Configuración → Bot, en «Preguntas del bot», tocá «Agregar pregunta».",
      "Escribí la respuesta como se la darías a un jugador y tocá «Guardar cambios».",
      "Sobre el club responde solo con eso: lo que no cargaste, dice que no lo sabe.",
    ],
    keywords: [
      "bot",
      "preguntas frecuentes",
      "faq",
      "respondio mal",
      "no sabe",
      "invento",
      "estacionamiento",
      "paletas",
      "ensenar",
    ],
    tour: "faq-bot",
  },
  {
    id: "alta-empleado",
    audience: "owner",
    question: "¿Cómo le doy acceso a un empleado nuevo?",
    answer: [
      "En Configuración → Equipo, tocá «Agregar usuario».",
      "Poné su nombre y su email, y tocá «Crear usuario».",
      "Pasale la contraseña temporal: al entrar elige la suya y le aparece «Tu primer día».",
    ],
    keywords: ["empleado", "nuevo", "usuario", "acceso", "alta", "recepcionista", "agregar", "staff", "invitar"],
    tour: "alta-empleado",
  },
  {
    id: "baja-empleado",
    audience: "owner",
    question: "Un empleado se fue, ¿cómo le saco el acceso?",
    answer: [
      "En Configuración → Equipo, tocá «Desactivar» en su fila.",
      "Lo saca del panel al toque, aunque tenga la sesión abierta. Lo que hizo queda en el historial.",
    ],
    keywords: ["baja", "desactivar", "renuncio", "se fue", "sacar acceso", "eliminar usuario", "borrar empleado"],
    tour: "baja-empleado",
  },
  {
    id: "empleado-clave",
    audience: "owner",
    question: "Un empleado se olvidó la contraseña",
    answer: [
      "En Configuración → Equipo, tocá la llave en su fila.",
      "Te muestra una contraseña temporal: pasásela por WhatsApp.",
      "Al entrar, el panel le pide que elija una nueva.",
    ],
    keywords: ["contrasena", "clave", "olvido", "password", "resetear", "no puede entrar", "empleado"],
    tour: "empleado-clave",
  },
  {
    id: "cerrar-cancha",
    audience: "owner",
    question: "Tengo que cerrar una cancha por mantenimiento",
    answer: [
      "En la Agenda, tocá «Bloquear turnos» y marcá los turnos de esa cancha.",
      "Tocá «Bloquear» abajo. Para otro día, pasá de día y repetí.",
      "Las reservas que ya había no se bloquean: movelas o cancelalas.",
    ],
    keywords: ["mantenimiento", "cerrar", "cancha", "arreglo", "obra", "reparacion", "bloquear", "fuera de servicio"],
    tour: "bloquear",
  },
  {
    id: "bloquear-jugador",
    audience: "owner",
    question: "¿Cómo bloqueo a un jugador?",
    answer: [
      "En Jugadores, tocá su nombre y después «Bloquear jugador».",
      "El bot no le toma más reservas a ese número.",
      "Desde el mostrador lo podés seguir anotando si querés.",
    ],
    keywords: ["bloquear", "jugador", "prohibir", "no dejar reservar", "moroso", "problematico", "banear"],
    tour: "bloquear-jugador",
  },
  {
    id: "stock",
    audience: "owner",
    question: "¿Cómo controlo el stock de un producto?",
    answer: [
      "En Productos, «Catálogo», tocá el lápiz y activá «Controlo el stock».",
      "Poné cuánto «Hay hoy» y en «Avisar cuando queden», el mínimo. Tocá «Guardar».",
      "Cada consumo descuenta solo; al llegar al mínimo aparece en «Para comprar».",
    ],
    keywords: ["stock", "inventario", "cuanto queda", "minimo", "reponer", "faltante", "kiosco", "bebidas"],
    tour: "stock",
  },
  {
    id: "kiosco-dueno",
    audience: "owner",
    question: "¿Dónde cobro una venta suelta o cargo la mercadería que llegó?",
    answer: [
      "En Productos, «Mostrador»: «Cobrar» o «Cargar stock», con el lector o tocando el producto.",
      "Las ventas del día quedan en «Ventas de hoy». «Contar stock» está arriba a la derecha.",
    ],
    keywords: [
      "venta",
      "suelta",
      "mercaderia",
      "proveedor",
      "llego",
      "contar",
      "conteo",
      "vender",
      "sin turno",
      "lector",
      "mostrador",
      "cobrar",
    ],
    tour: "kiosco-dueno",
  },
  {
    id: "reportes",
    audience: "owner",
    question: "¿Cómo leo los Reportes?",
    answer: [
      "«Total recaudado» son las señas más lo cobrado en el mostrador (efectivo y QR).",
      "«Kiosco» es lo vendido: lo que se cobró ya está dentro de «Mostrador».",
      "En «Ocupación», el mapa de calor muestra qué horarios se llenan y cuáles no.",
    ],
    keywords: ["reportes", "ingresos", "recaudacion", "cuanto gane", "ocupacion", "estadisticas", "numeros", "facturacion"],
    tour: "reportes",
  },
  {
    id: "reglas-casa",
    audience: "owner",
    question: "¿Cómo les dejo instrucciones a mis empleados?",
    answer: [
      "En Configuración → Equipo, en «Reglas de la casa», tocá «Agregar regla».",
      "Escribí la pregunta y la respuesta, y guardá: les aparece en este «?».",
      "El bot no las ve: son solo para tu equipo.",
    ],
    keywords: ["reglas", "instrucciones", "empleados", "equipo", "recepcion", "normas", "explicar"],
    tour: "reglas-casa",
  },
  {
    id: "transferencia-dueno",
    audience: "owner",
    question: "El jugador dice que transfirió y no aparece",
    answer: [
      "Fijate si la plata entró en tu cuenta de MercadoPago o del banco.",
      "Si entró, en Pagos tocá «Confirmar reserva» en esa reserva.",
      "Si entró hace menos de una hora, puede estar en «Transferencias sin asignar»: «Asignar».",
    ],
    keywords: ["transferi", "transfirio", "transferencia", "ya pague", "comprobante", "no figura", "no aparece", "alias"],
    tour: "sena",
  },
  {
    id: "cambiar-clave-dueno",
    audience: "owner",
    question: "¿Cómo cambio mi contraseña?",
    answer: ["Arriba a la derecha, tocá la llave.", "Si te la olvidaste, escribinos y te ayudamos."],
    keywords: ["contrasena", "clave", "password", "olvide", "entrar", "usuario"],
    tour: "cambiar-clave",
  },
  {
    id: "armar-pena",
    audience: "all",
    question: "¿Cómo armo una peña?",
    answer: [
      "En «Peñas», tocá «Nueva peña» y elegí canchas, día y horario: esos turnos se bloquean solos.",
      "Anotá las parejas con «Anotar pareja».",
      "En «Partidos», tocá «Armar partidos»: juegan todos contra todos, repartidos en las canchas.",
    ],
    keywords: ["peña", "pena", "todos contra todos", "americano", "parejas", "juntada"],
    tour: "armar-pena",
  },
  {
    id: "armar-torneo",
    audience: "all",
    question: "¿Cómo armo un torneo?",
    answer: [
      "En «Torneos», tocá «Nuevo torneo» con sus días, canchas y categorías.",
      "Anotá las parejas y marcá quién pagó la inscripción.",
      "En «Partidos», «Armar zonas»; cuando estén los resultados, «Armar cuadro».",
    ],
    keywords: ["torneo", "categoria", "zonas", "cuadro", "llave", "fixture", "inscripcion", "americano"],
    tour: "armar-torneo",
  },
  {
    id: "turno-torneo",
    audience: "all",
    question: "¿Por qué un turno dice «Torneo» o «Peña»?",
    answer: [
      "Está tomado por ese torneo o peña: nadie lo puede reservar, ni el bot.",
      "Se libera solo si cambiás los horarios o las canchas del evento, o si lo cancelás.",
    ],
    keywords: ["torneo", "peña", "pena", "bloqueado", "evento", "no se puede reservar"],
  },
] as const satisfies readonly HelpEntry[];

export type HelpEntryId = (typeof HELP_ENTRIES)[number]["id"];

/** One entry by id — for the screens that link to it (<StatusWhy />). */
export function getHelpEntry(id: HelpEntryId): HelpEntry {
  return HELP_ENTRIES.find((entry) => entry.id === id)!;
}
