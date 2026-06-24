import { redirect } from "next/navigation";

// Las reservas viven ahora dentro de la Agenda (Calendario | Lista).
export default function ReservasPage() {
  redirect("/panel/agenda");
}
