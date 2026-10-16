import { PageHeader } from "@/components/ui/page-header";
import { ImprovementsScreen } from "@/features/improvements/components/improvements-screen";

export default function MejorasPage() {
  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Mejoras"
        description="Lo que vamos sumando a GTP y lo que nos pidieron. Si se te ocurre algo, contanos."
      />
      <ImprovementsScreen />
    </div>
  );
}
