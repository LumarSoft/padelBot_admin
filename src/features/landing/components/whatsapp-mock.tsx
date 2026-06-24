import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A stylised WhatsApp conversation showing the bot booking a court and asking
 * for the deposit ("seña"). This is the hero's money shot — pure markup, no
 * real data, designed to read at a glance.
 */

interface Bubble {
  from: "bot" | "player";
  text: string;
  time: string;
}

const CONVERSATION: Bubble[] = [
  {
    from: "player",
    text: "Hola! tenés cancha para hoy a la noche? 🎾",
    time: "20:41",
  },
  {
    from: "bot",
    text: "¡Hola Marce! Tengo libre el turno de las 21:00 en la Cancha 2. ¿Te lo reservo?",
    time: "20:41",
  },
  { from: "player", text: "Dale, joya 🙌", time: "20:42" },
  {
    from: "bot",
    text: "Listo, te lo reservo 90 min. Para confirmarlo, transferí la seña de $5.000 al alias canchea.centro y te aviso apenas la reciba.",
    time: "20:42",
  },
  { from: "player", text: "Ya te transferí ✅", time: "20:45" },
  {
    from: "bot",
    text: "¡Recibido! ✅ Turno confirmado: hoy 21:00, Cancha 2. Te esperamos 🎾",
    time: "20:45",
  },
];

function MessageBubble({ bubble }: { bubble: Bubble }) {
  const isBot = bubble.from === "bot";
  return (
    <div
      className={cn(
        "chat-bubble flex",
        isBot ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm",
          isBot
            ? "rounded-bl-sm bg-card text-card-foreground"
            : "rounded-br-sm bg-emerald-600 text-white",
        )}
      >
        <p className="text-pretty">{bubble.text}</p>
        <span
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isBot ? "text-muted-foreground" : "text-white/70",
          )}
        >
          {bubble.time}
          {!isBot && <CheckCheck className="size-3" />}
        </span>
      </div>
    </div>
  );
}

export function WhatsAppMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full max-w-sm rounded-[2rem] border border-border bg-background p-2.5 shadow-2xl shadow-brand/10",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.6rem] border border-border/60">
        {/* Chat header */}
        <div className="flex items-center gap-3 bg-emerald-700 px-4 py-3 text-white">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            PC
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">Padel Club Centro</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-100">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              en línea · responde al instante
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-2 bg-muted/40 px-3 py-4">
          {CONVERSATION.map((bubble, i) => (
            <MessageBubble key={i} bubble={bubble} />
          ))}
        </div>
      </div>

      {/* Floating "real-time panel" card */}
      <div className="panel-float absolute -bottom-6 -left-5 hidden w-60 rounded-xl border border-border bg-card p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
            <Check className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-medium">Nueva reserva en el panel</p>
            <p className="text-muted-foreground text-[11px]">
              Cancha 2 · 21:00 · Confirmada
            </p>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-[10px]">
          Apareció sola, sin refrescar.
        </p>
      </div>
    </div>
  );
}
