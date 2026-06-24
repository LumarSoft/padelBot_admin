import {
  CalendarDays,
  Wallet,
  MessagesSquare,
  Radio,
  Check,
} from "lucide-react";
import { Container, LandingButton, SectionHeading } from "./landing-ui";

const PANEL_FEATURES = [
  {
    icon: CalendarDays,
    title: "Agenda en vivo",
    text: "Calendario y lista de todos los turnos, por cancha y por día. Reservá o bloqueá vos mismo cuando haga falta.",
  },
  {
    icon: Wallet,
    title: "Pagos conciliados",
    text: "Mirá qué señas entraron y cuáles faltan, ya cruzadas con su reserva. La caja del día, clara.",
  },
  {
    icon: MessagesSquare,
    title: "Conversaciones del bot",
    text: "Seguí cada charla en tiempo real y tomá el control de la que quieras, sin perder el hilo.",
  },
  {
    icon: Radio,
    title: "Tiempo real",
    text: "Cuando el bot toma una reserva, aparece sola en el panel. Sin refrescar, sin recargar nada.",
  },
];

/** A small, stylised snapshot of the owner panel — pure markup. */
function PanelMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-brand/10">
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-500/70" />
        <span className="text-muted-foreground ml-3 text-xs font-medium">
          panel.canchea.com.ar
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Reservas hoy", value: "12" },
            { label: "Señas cobradas", value: "$58.000" },
            { label: "Ocupación", value: "84%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-background p-3"
            >
              <p className="text-muted-foreground text-[11px]">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Bookings list */}
        <div className="flex flex-col gap-2">
          {[
            { time: "19:30", court: "Cancha 1", name: "Lucía F.", ok: true },
            { time: "21:00", court: "Cancha 2", name: "Marce B.", ok: true },
            { time: "22:30", court: "Cancha 3", name: "Diego R.", ok: false },
          ].map((row) => (
            <div
              key={row.time + row.court}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
            >
              <span className="text-sm font-semibold tabular-nums">
                {row.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{row.name}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {row.court}
                </p>
              </div>
              <span
                className={
                  row.ok
                    ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600"
                    : "rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-600"
                }
              >
                {row.ok ? (
                  <>
                    <Check className="size-3" /> Confirmada
                  </>
                ) : (
                  "Espera seña"
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PanelShowcase() {
  return (
    <section id="panel" className="scroll-mt-20 border-t border-border/60 py-20">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="reveal order-2 lg:order-1">
          <PanelMock />
        </div>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <SectionHeading
            eyebrow="El panel"
            title="Y vos mirás todo desde un solo lugar"
            lead="El bot trabaja de cara al jugador; el panel te da el control. Diseñado para que un dueño lo entienda en minutos."
          />

          <ul className="flex flex-col gap-5">
            {PANEL_FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="reveal flex gap-4">
                <span className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div>
            <LandingButton href="/login" variant="secondary">
              Entrar al panel
            </LandingButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
