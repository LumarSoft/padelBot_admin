"use client";

import { Lock } from "lucide-react";
import { PadelBall } from "@/components/ui/padel-ball";
import { cn } from "@/lib/utils";
import {
  useNotificationFeed,
  type FeedEntry,
  type FeedNotification,
} from "../hooks/use-notification-feed";

/** 02:51 — the first notification of the night. */
const START_MINUTE = 2 * 60 + 51;
const VISIBLE = 3;

const SCRIPT: FeedEntry[] = [
  {
    title: "Pago conciliado",
    body: "Llegó la seña de Nico G. ($5.000). Sáb 19:30 · Cancha 3, confirmado.",
    gap: 0,
  },
  {
    title: "El bot le respondió a Juli",
    body: "«Tengo 22:30 en la Cancha 1, ¿te la reservo?»",
    gap: 7,
  },
  {
    title: "Nueva reserva confirmada",
    body: "Marce B. · Sáb 21:00 · Cancha 2. Seña cobrada por MercadoPago.",
    gap: 9,
  },
  {
    title: "Te necesita a vos",
    body: "Pablo quiere armar un torneo de 16 parejas. El bot dejó el chat para vos.",
    gap: 6,
    needsOwner: true,
  },
  {
    title: "Turno ofrecido sin pisarse",
    body: "Las 21:00 ya estaban tomadas: el bot le ofreció 22:30 a Fede y aceptó.",
    gap: 8,
  },
  {
    title: "Nueva reserva confirmada",
    body: "Juli P. · Sáb 22:30 · Cancha 1. Seña cobrada por MercadoPago.",
    gap: 5,
  },
];

function formatClock(minuteOfDay: number): string {
  const minutes = ((minuteOfDay % 1440) + 1440) % 1440;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatAgo(now: number, at: number): string {
  const diff = now - at;
  return diff <= 0 ? "ahora" : `hace ${diff} min`;
}

function NotificationCard({
  item,
  now,
}: {
  item: FeedNotification;
  now: number;
}) {
  return (
    <li
      className={cn(
        "animate-fade-up bg-chalk/[0.88] text-ink flex h-[5.25rem] gap-3 rounded-[1.4rem] px-3.5 py-3 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl",
        item.needsOwner && "ring-ball ring-2",
      )}
    >
      <span className="bg-ink flex size-10 shrink-0 items-center justify-center rounded-[0.7rem]">
        <PadelBall className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold">{item.title}</span>
          <span className="text-ink/50 shrink-0 text-[11px]">
            {formatAgo(now, item.at)}
          </span>
        </span>
        <span className="text-ink/75 line-clamp-2 text-[13px] leading-snug">
          {item.body}
        </span>
      </span>
    </li>
  );
}

/**
 * The club owner's phone at 3 AM: a huge lock-screen clock and GTP's
 * notifications stacking up — what they'll find when they wake up.
 */
export function LockScreen({ className }: { className?: string }) {
  const { now, items } = useNotificationFeed(SCRIPT, START_MINUTE, VISIBLE);

  return (
    <div className={cn("relative mx-auto flex w-full max-w-[26rem] flex-col items-center", className)}>
      <div aria-hidden className="flex flex-col items-center">
        <Lock className="text-chalk/60 mb-1.5 hidden size-4 sm:block" />
        <p className="text-chalk/80 text-sm font-medium sm:text-[15px]">Sábado 14 de octubre</p>
        <p className="font-display text-chalk -mt-1 bg-linear-to-b from-chalk to-chalk/55 bg-clip-text text-[clamp(6rem,28vw,13rem)] leading-[0.95] font-black tracking-[-0.02em] text-transparent tabular-nums">
          {formatClock(now)}
        </p>
      </div>

      <ol
        aria-label="Notificaciones de ejemplo que GTP le manda al dueño del club"
        className="relative -mt-[clamp(1rem,5vw,2.5rem)] flex w-full flex-col gap-2"
      >
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} now={now} />
        ))}
      </ol>
    </div>
  );
}
