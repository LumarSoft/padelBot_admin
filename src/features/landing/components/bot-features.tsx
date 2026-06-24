import {
  Bot,
  Zap,
  Wallet,
  RefreshCcw,
  ShieldCheck,
  Hand,
  LayoutGrid,
  Tags,
} from "lucide-react";
import { Container, SectionHeading } from "./landing-ui";

const FEATURES = [
  {
    icon: Bot,
    title: "Atención 24/7 con IA",
    text: "Entiende lenguaje natural y responde como una persona, en español rioplatense. Nunca duerme ni se toma franco.",
  },
  {
    icon: Zap,
    title: "Reserva en segundos",
    text: "Le propone los horarios libres al jugador, confirma el turno y bloquea la cancha al instante.",
  },
  {
    icon: Wallet,
    title: "Cobro de seña automático",
    text: "Pide la transferencia de la seña y retiene el turno hasta que llega el pago. Sin que muevas un dedo.",
  },
  {
    icon: RefreshCcw,
    title: "Conciliación MercadoPago",
    text: "Cruza cada transferencia entrante con la reserva exacta y la confirma sola. Cero planillas.",
  },
  {
    icon: ShieldCheck,
    title: "Sin turnos pisados",
    text: "Un turno, una sola reserva. El sistema impide que dos jugadores tomen el mismo horario.",
  },
  {
    icon: Hand,
    title: "Tomás el control cuando querés",
    text: "Si una charla necesita tu toque, entrás vos y el bot se corre. Después se lo devolvés con un clic.",
  },
  {
    icon: LayoutGrid,
    title: "Multi-cancha y horarios",
    text: "Cargá todas tus canchas con sus franjas horarias. El bot conoce la disponibilidad real de cada una.",
  },
  {
    icon: Tags,
    title: "Precios por horario y día",
    text: "Definí reglas de precio (hora pico, fin de semana) y el bot cotiza siempre el valor correcto.",
  },
];

export function BotFeatures() {
  return (
    <section id="bot" className="scroll-mt-20 border-t border-border/60 py-20">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="El bot"
          title="Un empleado que atiende, reserva y cobra solo"
          lead="Todo lo que hoy hacés a mano por WhatsApp, lo resuelve el bot — bien y al toque."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="reveal group hover:border-brand/40 flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5 transition-colors"
            >
              <span className="bg-brand/10 text-brand flex size-10 items-center justify-center rounded-xl transition-transform group-hover:-translate-y-0.5">
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
