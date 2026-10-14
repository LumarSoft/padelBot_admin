import type { TourId } from "@/features/help/content/tours";
import type { FirstDayTaskId } from "@/types/api/help";

/**
 * "Tu primer día": the five things a receptionist does every day. The API ticks each one from
 * what the user really did (see `api/src/help/lib/first-day.ts`); this only names them and
 * links each to its "Mostrame".
 */
export const FIRST_DAY_TASKS: { id: FirstDayTaskId; title: string; tour: TourId }[] = [
  { id: "booking", title: "Anotá un turno desde la Agenda", tour: "anotar-turno" },
  { id: "consumption", title: "Cargale una bebida a un turno", tour: "consumo" },
  { id: "deskPayment", title: "Registrá un cobro en el mostrador", tour: "cobro" },
  { id: "deposit", title: "Confirmá una seña pendiente", tour: "sena" },
  { id: "reschedule", title: "Mové un turno a otro horario", tour: "mover" },
];
