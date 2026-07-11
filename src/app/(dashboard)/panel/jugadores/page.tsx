import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { PlayersScreen } from "@/features/jugadores/components/players-screen";

export default async function JugadoresPage() {
  await requireSession();

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Jugadores"
        description="La ficha de cada jugador: historial, ausencias, crédito a favor y bloqueos."
      />
      <PlayersScreen />
    </div>
  );
}
