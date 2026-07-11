import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { PlayersScreen } from "@/features/jugadores/components/players-screen";

export default async function JugadoresPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Jugadores"
        description="La ficha de cada jugador: historial, ausencias, crédito a favor y bloqueos."
      />
      <PlayersScreen />
    </div>
  );
}
