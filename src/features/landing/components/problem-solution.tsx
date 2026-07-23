import { Clock, MessageSquareWarning, CalendarX2, Banknote } from "lucide-react";
import { Container, SectionHeading } from "./landing-ui";

const PROBLEMS = [
  {
    icon: Clock,
    title: "Mensajes a cualquier hora",
    text: "Los jugadores escriben a la noche y los fines de semana. Si no respondés rápido, reservan en otro lado.",
  },
  {
    icon: Banknote,
    title: "Señas que no cierran",
    text: "Pedís la transferencia a mano y después tenés que cruzar cada pago de MercadoPago con la reserva correcta.",
  },
  {
    icon: CalendarX2,
    title: "Turnos pisados",
    text: "Dos personas que querían el mismo horario, una agenda en papel o en el grupo, y el quilombo del lado tuyo.",
  },
  {
    icon: MessageSquareWarning,
    title: "Tu tiempo en el WhatsApp",
    text: "Horas respondiendo lo mismo: ¿tenés cancha?, ¿cuánto sale?, ¿cómo pago? En vez de gestionar el club.",
  },
];

export function ProblemSolution() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="El problema"
          title="Gestionar las reservas a mano te quita tiempo y plata"
          lead="Cada mensaje sin responder es un turno que se enfría. GTP se ocupa de todo eso por vos."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="reveal flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5"
            >
              <span className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
