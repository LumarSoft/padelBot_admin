import { Plus } from "lucide-react";
import { Container, SectionHeading } from "./landing-ui";

const FAQS = [
  {
    q: "¿Tengo que cambiar mi número de WhatsApp?",
    a: "No. Conectamos tu línea de WhatsApp al bot durante la puesta en marcha. Tus jugadores siguen escribiendo al mismo número de siempre.",
  },
  {
    q: "¿Cómo cobra la seña?",
    a: "El bot le pasa al jugador tu alias o link de MercadoPago, y cuando llega la transferencia la concilia automáticamente con la reserva correcta y confirma el turno.",
  },
  {
    q: "¿Puedo responder yo cuando quiera?",
    a: "Sí. Desde el panel entrás a cualquier conversación y tomás el control; el bot se corre al instante. Cuando terminás, se lo devolvés con un clic.",
  },
  {
    q: "¿Qué pasa si dos personas quieren el mismo turno?",
    a: "Imposible que se pisen. El sistema garantiza un turno, una sola reserva — aunque el bot y vos estén operando al mismo tiempo.",
  },
  {
    q: "¿Sirve si tengo varias canchas?",
    a: "Sí. Cargás todas tus canchas con sus horarios y precios, y el bot conoce la disponibilidad real de cada una.",
  },
  {
    q: "¿Cuánto tarda la puesta en marcha?",
    a: "Alrededor de 15 minutos con una checklist guiada: datos del complejo, WhatsApp, cobros y tu primera cancha. Si te trabás, te ayudamos desde Lumarsoft.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border/60 py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="Preguntas" title="Lo que más nos preguntan" />

        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="reveal group rounded-2xl border border-border bg-card/50 px-5 [&_summary]:list-none"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-medium">
                {q}
                <Plus className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-45" />
              </summary>
              <p className="text-muted-foreground -mt-1 pb-4 text-sm text-pretty">
                {a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
