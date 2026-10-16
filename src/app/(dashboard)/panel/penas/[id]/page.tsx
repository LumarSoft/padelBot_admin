import { requireSession } from "@/lib/session";
import { CompetitionDetailScreen } from "@/features/competitions/components/competition-detail-screen";

export default async function PenaPage(props: PageProps<"/panel/penas/[id]">) {
  await requireSession();
  const { id } = await props.params;

  return <CompetitionDetailScreen id={id} kind="PENA" />;
}
