import { ArrowRight } from "lucide-react";
import { Container, DisplayTitle, Eyebrow, LandingButton } from "./landing-ui";

const STEPS = [
  {
    duration: "2 minutos",
    title: "Contanos de tu club",
    text: "Respondés unas preguntas: canchas, horarios, precio y seña. Con eso ya queda medio club configurado.",
  },
  {
    duration: "~15 minutos",
    title: "Lo dejamos andando juntos",
    text: "Conectamos tu WhatsApp y tu MercadoPago, cargamos canchas, turnos fijos y equipo. Te acompañamos en cada paso.",
  },
  {
    duration: "Desde el día 1",
    title: "Tus jugadores escriben como siempre",
    text: "Al mismo número. No tienen que bajarse nada: la única diferencia es que ahora les contestan al toque.",
  },
];

export function SetupSteps() {
  return (
    <section className="bg-paper text-ink py-24 lg:py-32">
      <Container className="flex flex-col gap-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-5">
            <Eyebrow className="text-court">Puesta en marcha</Eyebrow>
            <DisplayTitle>Andando en una tarde.</DisplayTitle>
          </div>
          <p className="text-ink/70 max-w-md text-lg text-pretty">
            Sin instalar nada, sin cambiar tu número y sin cursos. Si te
            trabás, del otro lado hay una persona de Lumarsoft.
          </p>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="reveal bg-paper flex flex-col gap-4 p-7 sm:p-9">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-court text-7xl leading-none font-black">
                  0{i + 1}
                </span>
                <span className="text-ink/60 font-mono text-xs tracking-wider uppercase">
                  {step.duration}
                </span>
              </div>
              <h3 className="font-display text-3xl leading-none font-extrabold uppercase">
                {step.title}
              </h3>
              <p className="text-ink/70 text-pretty">{step.text}</p>
            </li>
          ))}
        </ol>

        <div>
          <LandingButton href="/register" variant="ink">
            Empezar ahora · 14 días gratis
            <ArrowRight className="size-4.5" />
          </LandingButton>
        </div>
      </Container>
    </section>
  );
}
