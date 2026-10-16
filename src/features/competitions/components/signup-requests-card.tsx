"use client";

import { MessageCircleMore } from "lucide-react";
import { useSignupRequests } from "@/features/competitions/hooks/use-signup-requests";
import { SignupRequestRow } from "@/features/competitions/components/signup-request-row";

/** On the event: who asked the bot to sign up and is still waiting for an answer. */
export function SignupRequestsCard({ competitionId }: { competitionId: string }) {
  const { data } = useSignupRequests({ status: "PENDING", competitionId });
  const pending = data ?? [];
  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <MessageCircleMore className="size-4 text-amber-600 dark:text-amber-400" />
        {pending.length === 1
          ? "1 jugador pidió anotarse por WhatsApp"
          : `${pending.length} jugadores pidieron anotarse por WhatsApp`}
      </p>
      <p className="text-muted-foreground mb-1 text-xs">
        Escribiles para armar la pareja y cobrar la inscripción; después cargala con «Anotar pareja».
      </p>
      {pending.map((request) => (
        <SignupRequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}
