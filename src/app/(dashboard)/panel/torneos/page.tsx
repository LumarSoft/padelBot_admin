import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CompetitionsScreen } from "@/features/competitions/components/competitions-screen";
import { CreateCompetitionDialog } from "@/features/competitions/components/create-competition-dialog";

export default async function TorneosPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Torneos"
        description="Categorías, inscripciones, zonas, cuadro y resultados. Las canchas del torneo se bloquean solas en la agenda."
        actions={<CreateCompetitionDialog kind="TOURNAMENT" />}
      />
      <CompetitionsScreen kind="TOURNAMENT" />
    </div>
  );
}
