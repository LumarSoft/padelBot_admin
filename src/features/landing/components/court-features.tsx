import { Check } from "lucide-react";
import { Container, DisplayTitle, Eyebrow } from "./landing-ui";

interface Feature {
  title: string;
  text: string;
}

const BOT_FEATURES: Feature[] = [
  { title: "Atiende 24/7", text: "Responde en segundos, en español rioplatense, como una persona." },
  { title: "Disponibilidad real", text: "Conoce los horarios libres de cada una de tus canchas." },
  { title: "Tus precios", text: "Cotiza según el día y la franja horaria que configures." },
  { title: "Cobra la seña", text: "Pide la transferencia y retiene el turno hasta que llega." },
  { title: "Concilia MercadoPago", text: "Cruza cada pago con su reserva y la confirma sola." },
  { title: "Ofrece alternativas", text: "Si el turno está tomado, propone otro horario u otra cancha." },
  { title: "Te pasa la charla", text: "Cuando hace falta tu toque, te avisa y se corre." },
];

const PANEL_FEATURES: Feature[] = [
  { title: "Agenda en vivo", text: "Todas las canchas, por día, actualizadas al instante." },
  { title: "Pagos y señas", text: "Qué entró, qué falta y de quién, cruzado con cada turno." },
  { title: "Conversaciones", text: "Cada charla del bot, con el botón para tomar el control." },
  { title: "Turnos fijos", text: "Los habituales de cada semana se generan solos." },
  { title: "Jugadores", text: "Historial de cada uno, y quién no se presentó." },
  { title: "Kiosco", text: "Cobrá con lector de códigos o cargalo a la cuenta del turno." },
  { title: "Reportes y equipo", text: "Lo recaudado por mes, y acceso para tus encargados." },
];

function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {features.map((feature) => (
        <li key={feature.title} className="flex gap-3">
          <span className="bg-ball text-ink mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
            <Check className="size-3" strokeWidth={3} />
          </span>
          <p className="text-pretty">
            <span className="text-chalk font-semibold">{feature.title}.</span>{" "}
            <span className="text-chalk/70">{feature.text}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Qué incluye" drawn as a padel court seen from above: the player's side of
 * the net is the bot, the owner's side is the panel. On phones the court
 * stands upright, so the net runs across.
 */
export function CourtFeatures() {
  return (
    <section
      id="incluye"
      className="bg-court text-chalk relative isolate scroll-mt-20 overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,transparent_0_44px,rgb(255_255_255/0.025)_44px_88px)]"
      />

      <Container className="flex flex-col gap-14">
        <div className="flex max-w-3xl flex-col gap-5">
          <Eyebrow className="text-ball">Qué incluye</Eyebrow>
          <DisplayTitle>Una cancha, dos lados.</DisplayTitle>
          <p className="text-chalk/75 max-w-2xl text-lg text-pretty">
            De un lado de la red, lo que vive el jugador. Del otro, lo que ves
            vos. Todo incluido, sin módulos aparte.
          </p>
        </div>

        <div className="border-chalk/80 relative grid rounded-sm border-2 lg:grid-cols-2">
          {/* Court lines: service lines near each end + centre line. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="bg-chalk/35 absolute inset-x-0 top-7 h-0.5 lg:inset-x-auto lg:inset-y-0 lg:top-0 lg:left-[6%] lg:h-auto lg:w-0.5" />
            <span className="bg-chalk/35 absolute inset-x-0 bottom-7 h-0.5 lg:inset-x-auto lg:inset-y-0 lg:bottom-0 lg:right-[6%] lg:left-auto lg:h-auto lg:w-0.5" />
          </div>

          <div className="relative flex flex-col gap-8 px-6 py-14 sm:px-10 lg:py-16 lg:pr-12 lg:pl-[calc(12%+2rem)]">
            <div>
              <p className="text-ball font-mono text-xs tracking-[0.2em] uppercase">
                Del lado del jugador
              </p>
              <h3 className="font-display mt-2 text-4xl leading-none font-black uppercase sm:text-5xl">
                El bot de WhatsApp
              </h3>
            </div>
            <FeatureList features={BOT_FEATURES} />
          </div>

          {/* The net */}
          <div
            aria-hidden
            className="bg-chalk/90 absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 lg:top-0 lg:left-1/2 lg:h-full lg:w-1 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <span className="bg-ball text-ink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.25em] whitespace-nowrap">
              LA RED
            </span>
          </div>

          <div className="relative flex flex-col gap-8 px-6 py-14 sm:px-10 lg:py-16 lg:pr-[calc(12%+2rem)] lg:pl-12">
            <div>
              <p className="text-ball font-mono text-xs tracking-[0.2em] uppercase">
                Del lado tuyo
              </p>
              <h3 className="font-display mt-2 text-4xl leading-none font-black uppercase sm:text-5xl">
                El panel del club
              </h3>
            </div>
            <FeatureList features={PANEL_FEATURES} />
          </div>
        </div>
      </Container>
    </section>
  );
}
