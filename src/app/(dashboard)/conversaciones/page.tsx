import { MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ConversacionesPage() {
  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Conversaciones"
        description="Los chats entre los jugadores y el bot. Interrumpí y tomá el control cuando haga falta."
      />
      <EmptyState
        icon={MessagesSquare}
        title="Sin conversaciones activas"
        description="Acá vas a ver los hilos del bot en vivo y vas a poder hacer handoff a un humano."
      />
    </div>
  );
}
