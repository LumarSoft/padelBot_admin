import type { ConversationSummary } from "@/types/api/conversations";

/** Argentine area codes with three digits (the rest have four, except Buenos Aires' 11). */
const AR_AREA_3 = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263", "264", "266", "280",
  "291", "294", "297", "298", "299", "336", "341", "342", "343", "345", "348", "351", "353",
  "358", "362", "364", "370", "376", "379", "380", "381", "383", "385", "387", "388",
]);

/**
 * WhatsApp's unread dot: the player wrote last and this browser hasn't opened the chat since.
 * (The API has no read receipts; this is per computer, see `chat-store`.)
 */
export function isUnread(
  conversation: Pick<ConversationSummary, "id" | "lastMessage">,
  readUpTo: Record<string, string>,
): boolean {
  const last = conversation.lastMessage;
  if (!last || last.role !== "USER") return false;
  const seen = readUpTo[conversation.id];
  return !seen || last.createdAt > seen;
}

/**
 * The bot owes an answer right now: AI mode and the player's message is the latest, from the
 * last minute. Shown as WhatsApp's green "escribiendo…".
 */
export function isBotTyping(
  conversation: Pick<ConversationSummary, "mode" | "lastMessage">,
  now = Date.now(),
): boolean {
  const last = conversation.lastMessage;
  return (
    conversation.mode === "AI" &&
    last?.role === "USER" &&
    now - new Date(last.createdAt).getTime() < 60_000
  );
}

/** Digits-only form so a `549…` waId and a `+54 9 …` phone still match. */
export function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * A waId the way WhatsApp shows it: "+54 9 341 555-1234" for an Argentine mobile,
 * "+<digits>" for anything else.
 */
export function formatPhone(waId: string): string {
  const d = digits(waId);
  if (d.length !== 13 || !d.startsWith("549")) return `+${d}`;
  const national = d.slice(3);
  const areaLength = national.startsWith("11") ? 2 : AR_AREA_3.has(national.slice(0, 3)) ? 3 : 4;
  const area = national.slice(0, areaLength);
  const local = national.slice(areaLength);
  return `+54 9 ${area} ${local.slice(0, -4)}-${local.slice(-4)}`;
}

/** The name WhatsApp would show: the player's name, else their number. */
export function displayName(conversation: Pick<ConversationSummary, "playerName" | "waId">): string {
  return conversation.playerName?.trim() || formatPhone(conversation.waId);
}

const time24 = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long" });
const shortDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const longDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });
const longDateWithYear = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole calendar days between `iso` and now (0 = today, 1 = yesterday). */
function daysAgo(iso: string, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "14:32" — a message's time. */
export function messageTime(iso: string): string {
  return time24.format(new Date(iso));
}

/** The chat list's right column: "14:32" today, "Ayer", "lunes" this week, then "12/10/2026". */
export function chatListTime(iso: string, now = new Date()): string {
  const days = daysAgo(iso, now);
  if (days <= 0) return messageTime(iso);
  if (days === 1) return "Ayer";
  if (days < 7) return weekday.format(new Date(iso));
  return shortDate.format(new Date(iso));
}

/** The floating day pill between messages: "Hoy", "Ayer", "Lunes", "12 de octubre". */
export function dayLabel(iso: string, now = new Date()): string {
  const days = daysAgo(iso, now);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return capitalize(weekday.format(new Date(iso)));
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear()
    ? longDate.format(date)
    : longDateWithYear.format(date);
}

/** Groups messages by calendar day. */
export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/**
 * What the bot stores for media it can't show: "[Audio]", "[Imagen / comprobante recibido]".
 * Returns the inner label, or null for a normal text.
 */
export function mediaPlaceholder(content: string): string | null {
  const match = /^\[([^\]\n]{1,60})\]$/.exec(content.trim());
  return match ? match[1] : null;
}

/** Number of emoji when a message is only emoji (1–3 render jumbo, like WhatsApp), else 0. */
export function emojiOnlyCount(content: string): number {
  const text = content.trim();
  if (!text || !/^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|\s)+$/u.test(text)) {
    return 0;
  }
  const segmenter = new Intl.Segmenter("es", { granularity: "grapheme" });
  return [...segmenter.segment(text.replace(/\s/g, ""))].length;
}
