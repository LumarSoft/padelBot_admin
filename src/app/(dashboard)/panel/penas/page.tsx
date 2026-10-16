import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CompetitionsScreen } from "@/features/competitions/components/competitions-screen";
import { CreateCompetitionDialog } from "@/features/competitions/components/create-competition-dialog";

export default async function PenasPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Peñas"
        description="Varias canchas en una franja, las parejas juegan todas contra todas. Los turnos se bloquean solos en la agenda."
        actions={<CreateCompetitionDialog kind="PENA" />}
      />
      <CompetitionsScreen kind="PENA" />
    </div>
  );
}
