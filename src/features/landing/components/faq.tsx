import { Plus } from "lucide-react";
import { Container, DisplayTitle, Eyebrow } from "./landing-ui";

const FAQS = [
  {
    q: "¿Tengo que cambiar mi número de WhatsApp?",
    a: "No. Conectamos tu línea de WhatsApp al bot durante la puesta en marcha. Tus jugadores siguen escribiendo al mismo número de siempre.",
  },
  {
    q: "¿Mis jugadores tienen que descargar algo?",
    a: "No. Escriben por WhatsApp, como hoy. No hay app, ni registro, ni link raro.",
  },
  {
    q: "¿Cómo cobra la seña?",
    a: "El bot le pasa al jugador tu alias de MercadoPago, retiene el turno y, cuando llega la transferencia, la concilia con la reserva correcta y confirma el turno.",
  },
  {
    q: "¿Y si el bot no sabe qué responder?",
    a: "Te avisa y deja la conversación para vos. Desde el panel entrás al chat, respondés, y cuando terminás se lo devolvés con un clic.",
  },
  {
    q: "¿Qué pasa si dos personas quieren el mismo turno?",
    a: "Imposible que se pisen. El sistema garantiza un turno, una sola reserva — aunque el bot y vos estén operando al mismo tiempo.",
  },
  {
    q: "¿Sirve si tengo varias canchas y precios distintos?",
    a: "Sí. Cargás todas tus canchas con sus horarios, y precios por día y franja horaria. El bot conoce la disponibilidad real de cada una y cotiza siempre el valor correcto.",
  },
  {
    q: "¿Cuánto tarda la puesta en marcha?",
    a: "Unos 15 minutos, paso a paso: datos del complejo, canchas, cobros, WhatsApp, turnos fijos y equipo. Lo hacemos con vos desde Lumarsoft.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-paper text-ink border-ink/10 scroll-mt-20 border-t py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="flex flex-col gap-5 lg:sticky lg:top-32 lg:self-start">
          <Eyebrow className="text-court">Preguntas</Eyebrow>
          <DisplayTitle>Lo que más nos preguntan.</DisplayTitle>
        </div>

        <div className="border-ink/15 flex flex-col border-t">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="reveal group border-ink/15 border-b [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="hover:text-court flex cursor-pointer items-center justify-between gap-6 py-6 text-lg font-semibold transition-colors sm:text-xl">
                {q}
                <span className="border-ink/20 group-open:bg-ink group-open:text-chalk flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors">
                  <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" />
                </span>
              </summary>
              <p className="text-ink/70 -mt-2 max-w-2xl pb-6 text-pretty">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
