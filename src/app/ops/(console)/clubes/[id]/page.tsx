import { ClubDetailScreen } from "@/features/ops/components/club-detail-screen";

export default async function OpsClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClubDetailScreen clubId={id} />;
}
