import { MessageCircle, CalendarCheck, BadgeCheck } from "lucide-react";
import { Container, SectionHeading } from "./landing-ui";

const STEPS = [
  {
    icon: MessageCircle,
    title: "El jugador escribe a tu WhatsApp",
    text: "Pregunta si hay cancha, como le escribiría a cualquier persona. El bot responde al instante, de día o de noche.",
  },
  {
    icon: CalendarCheck,
    title: "El bot reserva y pide la seña",
    text: "Propone un horario libre, toma la reserva y le pasa el alias para que transfiera la seña. El turno queda retenido.",
  },
  {
    icon: BadgeCheck,
    title: "Llega el pago y se confirma solo",
    text: "PadelBot concilia la transferencia, confirma el turno y lo muestra en tu panel en tiempo real. Listo.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-t border-border/60 py-20"
    >
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De la pregunta a la cancha confirmada, en tres pasos"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="reveal relative flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-xl font-semibold shadow-lg shadow-brand/25">
                  {i + 1}
                </span>
                <Icon className="text-brand size-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
