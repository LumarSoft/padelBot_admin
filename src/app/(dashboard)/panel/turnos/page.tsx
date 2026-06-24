import { redirect } from "next/navigation";

// Turnos se gestionan ahora desde Configuración (horarios y precios).
export default function TurnosPage() {
  redirect("/panel/configuracion");
}
