"use client";

import { useEffect, type ReactNode } from "react";
import {
  Bot,
  CalendarCheck,
  CalendarClock,
  Copy,
  ExternalLink,
  Headset,
  IdCard,
  MessageSquareText,
  UserCog,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDay } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { ConversationSession, ConversationSummary } from "@/types/api/conversations";
import { digits, displayName, formatPhone, messageTime } from "../lib/chat-format";
import { WaAvatar } from "./wa-avatar";

/** Human-readable label for the bot's internal FSM state. */
const STATE_LABELS: Record<string, string> = {
  IDLE: "Inactivo",
  MENU: "En el menú",
  BOOK_DATE: "Eligiendo fecha",
  BOOK_NAME: "Ingresando nombre",
  BOOK_COURT: "Eligiendo cancha",
  BOOK_SLOT: "Eligiendo horario",
  BOOK_CONFIRM: "Confirmando reserva",
  BOOK_DNI: "Ingresando DNI",
};

/**
 * WhatsApp's "Info. del contacto" drawer: who the player is for the club — bookings, the next
 * one, DNI, since when they write — plus opening the chat in WhatsApp itself or copying the
 * number. A column beside the chat on wide screens, over it on narrower ones. Esc closes it.
 */
export function ContactInfoPanel({
  conversation,
  session,
  onClose,
}: {
  conversation: ConversationSummary;
  session: ConversationSession | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const phone = formatPhone(conversation.waId);
  const name = displayName(conversation);
  const mode = session?.mode ?? conversation.mode;

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(`+${digits(conversation.waId)}`);
      toast.success("Número copiado");
    } catch {
      toast.error("No se pudo copiar el número");
    }
  }

  return (
    <aside
      aria-label="Info del contacto"
      className="bg-wa-bar border-wa-line animate-in slide-in-from-right-8 fade-in-0 absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l duration-300 ease-fluid sm:w-[24rem] xl:static xl:shrink-0"
    >
      <header className="bg-wa-panel flex h-16 shrink-0 items-center gap-6 px-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-wa-icon hover:bg-wa-hover -ml-2 flex size-9 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-5" />
        </button>
        <h2 className="text-wa-text text-base">Info. del contacto</h2>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-6">
        <section className="bg-wa-panel flex flex-col items-center px-6 pt-7 pb-5 text-center">
          <WaAvatar className="size-32" />
          <p className="text-wa-text mt-4 text-[22px] leading-tight">{name}</p>
          {conversation.playerName && <p className="text-wa-muted mt-1 text-base">{phone}</p>}
          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <a
              href={waLink(conversation.waId)}
              target="_blank"
              rel="noopener noreferrer"
              className="border-wa-line text-wa-green-text hover:bg-wa-hover flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm transition-colors"
            >
              <ExternalLink className="size-5" />
              Abrir en WhatsApp
            </a>
            <button
              type="button"
              onClick={copyNumber}
              className="border-wa-line text-wa-green-text hover:bg-wa-hover flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm transition-colors"
            >
              <Copy className="size-5" />
              Copiar número
            </button>
          </div>
        </section>

        <section className="bg-wa-panel px-6 py-4">
          <h3 className="text-wa-muted mb-2 text-sm">Quién responde</h3>
          <Row icon={mode === "HUMAN" ? UserCog : Bot}>
            {mode === "HUMAN" ? "Una persona del club" : "El bot (IA)"}
          </Row>
          {session?.needsAdvisor && (
            <Row icon={Headset} tone="amber">
              Pidió hablar con una persona
            </Row>
          )}
          {session && STATE_LABELS[session.state] && (
            <Row icon={MessageSquareText}>En el bot: {STATE_LABELS[session.state]}</Row>
          )}
        </section>

        {session ? (
          <section className="bg-wa-panel px-6 py-4">
            <h3 className="text-wa-muted mb-2 text-sm">En el club</h3>
            <Row icon={CalendarCheck}>
              {session.bookingsConfirmed === 0
                ? "Todavía no tiene reservas confirmadas"
                : `${session.bookingsConfirmed} ${session.bookingsConfirmed === 1 ? "reserva confirmada" : "reservas confirmadas"}${
                    session.bookingsUpcoming > 0 ? ` · ${session.bookingsUpcoming} por jugar` : ""
                  }`}
            </Row>
            {session.nextBooking && (
              <Row icon={CalendarClock}>
                Próxima: {formatDay(session.nextBooking.startsAt)} ·{" "}
                {messageTime(session.nextBooking.startsAt)} · {session.nextBooking.courtName}
              </Row>
            )}
            {session.playerDni && <Row icon={IdCard}>DNI {session.playerDni}</Row>}
            <Row icon={UserRoundCheck}>Escribe desde el {formatDay(session.createdAt)}</Row>
          </section>
        ) : (
          <section className="bg-wa-panel animate-pulse px-6 py-4">
            <div className="bg-wa-chip mb-3 h-3 w-24 rounded" />
            <div className="bg-wa-chip mb-2 h-4 w-3/4 rounded" />
            <div className="bg-wa-chip h-4 w-1/2 rounded" />
          </section>
        )}
      </div>
    </aside>
  );
}

function Row({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Bot;
  tone?: "amber";
  children: ReactNode;
}) {
  return (
    <p
      className={
        tone === "amber"
          ? "flex items-center gap-3 py-1.5 text-[15px] text-amber-600 dark:text-amber-400"
          : "text-wa-text flex items-center gap-3 py-1.5 text-[15px]"
      }
    >
      <Icon className={tone === "amber" ? "size-5 shrink-0" : "text-wa-icon size-5 shrink-0"} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
