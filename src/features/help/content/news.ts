import type { TourId } from "@/features/help/content/tours";

/**
 * "Novedades": what's new for the owner, at the top of their "?" help. Plain data, newest
 * first, edited by hand when something ships that the owner has to discover or turn on.
 *
 *   id      — stable slug (`a-z0-9-`), never reused. The server stores, per user, the newest
 *             id they've seen (`/help/news/seen`) and the "?" shows a dot until then. Never
 *             delete the newest entry; to prune, drop old ones from the end.
 *   date    — when it shipped (YYYY-MM-DD).
 *   title / line — one title and ONE line: what it does for the club, not how it's built.
 *   action  — "Activar" for something that's off until the owner turns it on, "Mostrame" for
 *             something to look at. Both run a guide (content/tours.ts) to the real control.
 *   activeWhen — for "Activar": the setting that, once on, turns the button into "Activada".
 *
 * Check every line against the code before adding it: the owner will go and look.
 */
export interface NewsEntry {
  id: string;
  date: string;
  title: string;
  line: string;
  action: { label: "Activar" | "Mostrame"; tour: TourId };
  activeWhen?: "fixedConfirmation";
}

export const NEWS: NewsEntry[] = [
  {
    id: "torneos-penas",
    date: "2026-10-15",
    title: "Torneos y peñas",
    line: "Anotá parejas, cobrá la inscripción y el panel arma zonas, cuadro o los partidos de la peña. Las canchas se bloquean solas.",
    action: { label: "Mostrame", tour: "armar-torneo" },
  },
  {
    id: "mostrador-lector",
    date: "2026-10-15",
    title: "Cobrá con lector de código de barras",
    line: "En Productos, «Mostrador»: escaneás y cobrás, o cargás la mercadería que llega. El stock se actualiza solo.",
    action: { label: "Mostrame", tour: "kiosco-dueno" },
  },
  {
    id: "confirmacion-fijos",
    date: "2026-10-14",
    title: "El bot les pregunta a los fijos si vienen",
    line: "Les escribe por WhatsApp antes del turno; si no vienen, se libera solo esa fecha.",
    action: { label: "Activar", tour: "confirmacion-fijos" },
    activeWhen: "fixedConfirmation",
  },
  {
    id: "stock-kiosco",
    date: "2026-10-14",
    title: "Stock del kiosco y venta suelta",
    line: "Activalo por producto: cada consumo descuenta solo y te avisamos cuando queda poco. Lo que se vende sin turno se cobra en «Mostrador».",
    action: { label: "Mostrame", tour: "stock" },
  },
  {
    id: "modo-sin-sena",
    date: "2026-10-14",
    title: "Reservas sin seña",
    line: "Si no querés cobrar seña, el bot anota y confirma el turno al toque, y se cobra todo en el club.",
    action: { label: "Mostrame", tour: "modo-cobro" },
  },
  {
    id: "ayuda-primer-dia",
    date: "2026-10-14",
    title: "«Tu primer día» para tus empleados",
    line: "Cada empleado nuevo tiene cinco tareas guiadas en el panel y vos ves en Equipo cuánto avanzó.",
    action: { label: "Mostrame", tour: "equipo-primer-dia" },
  },
];

/** The entries newer than the last one the user saw (all of them if they never opened the news). */
export function unseenNews(seenId: string | null): NewsEntry[] {
  const index = seenId ? NEWS.findIndex((entry) => entry.id === seenId) : -1;
  return index === -1 ? NEWS : NEWS.slice(0, index);
}
