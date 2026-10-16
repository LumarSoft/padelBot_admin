import type { Metadata } from "next";
import { ConversationsScreen } from "@/features/conversations/components/conversations-screen";

export const metadata: Metadata = {
  title: "WhatsApp · GTP",
};

/** The WhatsApp inbox. Full-bleed: no page header, it fills the panel like WhatsApp Web. */
export default function ConversacionesPage() {
  return <ConversationsScreen />;
}
