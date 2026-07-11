import { PageHeader } from "@/components/ui/page-header";
import { ConversationsScreen } from "@/features/conversations/components/conversations-screen";

export default function ConversacionesPage() {
  return (
    <div className="stagger-children flex flex-col gap-6">
      <PageHeader
        title="Conversaciones"
        description="Los chats entre los jugadores y el bot. Tomá el control cuando haga falta."
      />
      <ConversationsScreen />
    </div>
  );
}
