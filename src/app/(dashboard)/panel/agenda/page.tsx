import { AgendaScreen } from "@/features/agenda/components/agenda-screen";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  // Accept only a well-formed day key (e.g. from the global search deep link).
  const initialDayKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  // Keyed so navigating to a new ?date= remounts the screen on that day.
  return <AgendaScreen key={initialDayKey ?? "today"} initialDayKey={initialDayKey} />;
}
